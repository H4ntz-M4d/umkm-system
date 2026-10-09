import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import { EXPENSE_PROOF_MAX_FILES } from '@repo/schemas';
import { Pagination } from 'common/paginate/pagination';
import { ExpenseDto, UpdateExpenseDto } from 'expense/dto/expense.dto';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import { toExpenseDetailResponse, toExponseResponse } from './expense.response';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { buildExportFilename, buildWorkbook } from 'common/helpers/excel';

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Menghapus berkas di Cloudinary tanpa menggagalkan operasinya.
   *
   * Barisnya di database sudah hilang saat ini dipanggil. Kalau penghapusan
   * berkas gagal (jaringan, kredensial, berkasnya sudah tidak ada), yang
   * tertinggal cuma berkas yatim di Cloudinary — merugikan penyimpanan, tapi
   * tidak sebanding dengan menggagalkan penghapusan yang sudah terjadi dan
   * membuat admin mengira datanya masih ada.
   */
  private async discardImages(urls: string[]) {
    for (const url of urls) {
      try {
        await this.cloudinaryService.deleteImage(url);
      } catch (error) {
        this.logger.warn(
          `Gagal menghapus bukti pengeluaran di Cloudinary: ${url} (${String(error)})`,
        );
      }
    }
  }

  /// Dipakai unggah, hapus bukti, dan detail — supaya ketiganya mengembalikan
  /// bentuk yang sama.
  private async proofsOf(expenseId: bigint) {
    const proofs = await prisma.expenseProof.findMany({
      where: { expenseId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, image: true, createdAt: true },
    });

    return proofs;
  }
  /**
   * Dipakai bersama oleh listing dan ekspor.
   *
   * Diekstrak supaya berkas Excel tidak mungkin menyaring berbeda dari yang
   * tampil di layar — kalau filternya diketik dua kali, cepat atau lambat
   * keduanya menyimpang tanpa ada yang menyadari.
   */
  private buildWhere(
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Prisma.ExpenseWhereInput {
    return {
      ...(category && {
        expenseCategory: {
          name: { contains: category, mode: 'insensitive' },
        },
      }),

      ...(search && {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      }),

      date: {
        gte: dateFrom ? toStartOfDay(dateFrom) : undefined,
        lte: dateTo ? toEndOfDay(dateTo) : undefined,
      },
    };
  }

  async findAll(
    pagination: Pagination,
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const whereClause = this.buildWhere(search, category, dateFrom, dateTo);

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          storeId: true,
          categoryId: true,
          description: true,
          totalAmount: true,
          date: true,
          createdAt: true,
          expenseCategory: { select: { name: true } },
          _count: { select: { proofs: true } },
          userId: true,
          user: { select: { employees: { select: { name: true } } } },
        },
      }),
      prisma.expense.count({ where: whereClause }),
    ]);

    const result = data.map(toExponseResponse);

    return {
      success: true,
      data: result,
      meta: {
        skip,
        limit,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async summary() {
    const thisYear = new Date();
    const earlyYear = new Date(thisYear.getFullYear(), 0, 1);
    const earlyNextYear = new Date(thisYear.getFullYear() + 1, 0, 1);

    const totalExpense = await prisma.expense.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        date: {
          gte: earlyYear,
          lt: earlyNextYear,
        },
      },
    });

    const thisMonth = new Date();
    const earlyMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1,
    );
    const earlyNextMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      1,
    );

    const totalExpenseThisMonth = await prisma.expense.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        date: {
          gte: earlyMonth,
          lt: earlyNextMonth,
        },
      },
    });

    const totalActiveCategory = await prisma.expenseCategory.count({
      where: {
        isActive: true,
      },
    });

    const dataSummary = {
      totalExpense: totalExpense._sum.totalAmount ?? String(0),
      totalExpenseThisMonth:
        totalExpenseThisMonth._sum.totalAmount ?? String(0),
      totalActiveCategory: totalActiveCategory ?? 0,
    };

    return {
      success: true,
      data: dataSummary,
      meta: {
        timeStamp: new Date().toISOString(),
      },
    };
  }

  /// Detail satu pengeluaran, lengkap dengan item dan bukti — bentuk yang
  /// dibutuhkan dialog saat dibuka untuk diedit.
  async findOne(id: bigint) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        expenseItem: true,
        proofs: true,
        user: { select: { employees: { select: { name: true } } } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Maaf data pengeluaran tidak ditemukan');
    }

    return {
      success: true,
      data: toExpenseDetailResponse(expense),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Mencatat pengeluaran baru.
   *
   * `userId` datang dari token, bukan dari body: yang menginput tidak boleh
   * bisa mengatasnamakan orang lain. Kalau nanti dibutuhkan "diubah terakhir
   * oleh", itu kolom kedua — bukan menimpa kolom ini.
   */
  async create(data: ExpenseDto, userId: bigint) {
    const transaction = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          storeId: BigInt(data.storeId),
          categoryId: BigInt(data.categoryId),
          description: data.description,
          totalAmount: data.totalAmount,
          date: data.date,
          userId,
          expenseItem: {
            create: data.expenseItem.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          expenseItem: true,
          proofs: true,
          user: { select: { employees: { select: { name: true } } } },
        },
      });

      await tx.cashTransaction.create({
        data: {
          type: 'OUT',
          source: 'EXPENSE',
          referenceId: expense.id,
          amount: expense.totalAmount,
          storeId: expense.storeId,
        },
      });

      return expense;
    });

    /// Dilewatkan mapper dan dibungkus seperti `update`. Sebelumnya method ini
    /// mengembalikan entity Prisma mentah, sehingga dua jalur yang isinya sama
    /// berbeda bentuk responsnya.
    return {
      success: true,
      data: toExpenseDetailResponse(transaction),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Mengubah pengeluaran yang sudah tersimpan.
   *
   * Dua hal yang dijaga di sini:
   *
   * 1. **Itemnya diganti utuh**, bukan ditambal baris per baris. Form mengirim
   *    keadaan akhir yang dilihat admin; menyamakan baris lama dengan baris
   *    baru hanya menambah cara untuk salah, sementara hasilnya sama.
   * 2. **Kas ikut disesuaikan.** Pengeluaran mencatat satu baris kas keluar
   *    saat dibuat; kalau nominalnya diubah tanpa menyentuh kas, laporan
   *    keuangan diam-diam berbeda dari daftar pengeluaran.
   *
   * Bukti yang sudah terlampir tidak disentuh — mengunggah dan menghapusnya
   * punya endpoint sendiri.
   */
  async update(id: bigint, data: UpdateExpenseDto) {
    const isExisting = await prisma.expense.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!isExisting) {
      throw new NotFoundException('Maaf data pengeluaran tidak ditemukan');
    }

    const expense = await prisma.$transaction(async (tx) => {
      await tx.expenseItem.deleteMany({ where: { expenseId: id } });

      const updated = await tx.expense.update({
        where: { id },
        data: {
          storeId: BigInt(data.storeId),
          categoryId: BigInt(data.categoryId),
          description: data.description,
          totalAmount: data.totalAmount,
          date: data.date,
          expenseItem: {
            create: data.expenseItem.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          expenseItem: true,
          proofs: true,
          /// Hanya dibaca untuk respons — `userId` sendiri tidak ikut diubah:
          /// pencatat tetap pencatat, sekalipun yang mengedit orang lain.
          user: { select: { employees: { select: { name: true } } } },
        },
      });

      /// `updateMany` supaya tidak melempar kalau baris kasnya belum ada
      /// (data lama sebelum pencatatan kas, atau baris yang terlanjur
      /// terhapus); pengeluaran tetap tersimpan dan kas menyusul lewat
      /// pembuatan di bawah.
      const synced = await tx.cashTransaction.updateMany({
        where: { referenceId: id, source: 'EXPENSE' },
        data: { amount: updated.totalAmount, storeId: updated.storeId },
      });

      if (synced.count === 0) {
        await tx.cashTransaction.create({
          data: {
            type: 'OUT',
            source: 'EXPENSE',
            referenceId: updated.id,
            amount: updated.totalAmount,
            storeId: updated.storeId,
          },
        });
      }

      return updated;
    });

    return {
      success: true,
      data: toExpenseDetailResponse(expense),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Melampirkan foto bukti (nota, struk, bukti transfer).
   *
   * Batasnya dihitung dari yang SUDAH ada ditambah yang baru diunggah, bukan
   * per unggahan — kalau tidak, batas 5 bisa dilewati hanya dengan mengunggah
   * beberapa kali.
   *
   * Berkas diunggah ke Cloudinary lebih dulu, barisnya ditulis belakangan:
   * unggahan yang gagal di tengah jalan tidak meninggalkan baris yang
   * menunjuk gambar yang tidak ada.
   */
  async uploadProofs(id: bigint, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Tidak ada berkas yang diunggah');
    }

    const isExisting = await prisma.expense.findUnique({
      where: { id },
      select: { id: true, _count: { select: { proofs: true } } },
    });

    if (!isExisting) {
      throw new NotFoundException('Maaf data pengeluaran tidak ditemukan');
    }

    const sisa = EXPENSE_PROOF_MAX_FILES - isExisting._count.proofs;
    if (files.length > sisa) {
      throw new BadRequestException(
        sisa <= 0
          ? `Bukti pengeluaran ini sudah ${EXPENSE_PROOF_MAX_FILES} foto (batas maksimal). Hapus salah satu dulu kalau mau mengganti.`
          : `Sisa jatah lampiran tinggal ${sisa} foto, sedangkan yang dipilih ${files.length}.`,
      );
    }

    const uploaded = await this.cloudinaryService.uploadAllImages(
      files,
      CloudinaryFolder.EXPENSE_PROOF,
    );

    await prisma.expenseProof.createMany({
      data: uploaded.map((image) => ({ expenseId: id, image })),
    });

    return {
      success: true,
      data: await this.proofsOf(id),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /// Hapus satu lampiran. `expenseId` ikut dicocokkan supaya id bukti dari
  /// pengeluaran lain tidak bisa dipakai menghapus milik orang lain.
  async removeProof(id: bigint, proofId: bigint) {
    const proof = await prisma.expenseProof.findFirst({
      where: { id: proofId, expenseId: id },
      select: { id: true, image: true },
    });

    if (!proof) {
      throw new NotFoundException('Bukti pengeluaran tidak ditemukan');
    }

    await prisma.expenseProof.delete({ where: { id: proof.id } });
    await this.discardImages([proof.image]);

    return {
      success: true,
      data: await this.proofsOf(id),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async remove(id: bigint) {
    const isExisting = await prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!isExisting) {
      throw new BadRequestException('Maaf data pengeluaran tidak ditemukan');
    }

    const result = await prisma.expense.delete({
      where: { id },
      include: { expenseItem: true, proofs: true },
    });

    /// `deleteMany`, bukan `delete`: acuan+sumber tidak lagi unique di level
    /// Prisma sejak pesanan boleh punya beberapa baris kas (DP lalu
    /// pelunasan). Untuk EXPENSE tetap tepat satu baris — dijaga partial
    /// unique index `WHERE source <> 'ORDER'` — jadi yang terhapus tetap satu.
    await prisma.cashTransaction.deleteMany({
      where: {
        referenceId: id,
        source: 'EXPENSE',
      },
    });

    /// Barisnya ikut terhapus lewat cascade, tapi berkasnya di Cloudinary
    /// tidak — kalau tidak dihapus di sini, gambarnya menumpuk selamanya
    /// tanpa ada yang menunjuknya lagi.
    await this.discardImages(result.proofs.map((proof) => proof.image));

    return result;
  }

  /// Tanpa `skip`/`take`: filternya sama dengan listing, tapi seluruh baris
  /// ikut terbawa — inti dari ekspor yang tidak terpotong paginasi.
  async exportWorkbook(
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const rows = await prisma.expense.findMany({
      where: this.buildWhere(search, category, dateFrom, dateTo),
      orderBy: { date: 'desc' },
      select: {
        date: true,
        description: true,
        totalAmount: true,
        expenseCategory: { select: { name: true } },
        store: { select: { name: true } },
        user: { select: { employees: { select: { name: true } } } },
      },
    });

    const buffer = await buildWorkbook([
      {
        name: 'Pengeluaran',
        columns: [
          { header: 'Tanggal', key: 'date', width: 14 },
          { header: 'Kategori', key: 'category', width: 24 },
          { header: 'Toko', key: 'store', width: 22 },
          { header: 'Keterangan', key: 'description', width: 40 },
          { header: 'Diinput oleh', key: 'createdBy', width: 22 },
          { header: 'Jumlah', key: 'total', money: true },
        ],
        rows: rows.map((row) => ({
          date: row.date.toISOString().slice(0, 10),
          category: row.expenseCategory?.name ?? '-',
          store: row.store?.name ?? '-',
          description: row.description ?? '-',
          createdBy: row.user?.employees?.name ?? '-',
          total: row.totalAmount.toString(),
        })),
      },
    ]);

    return {
      buffer,
      filename: buildExportFilename('pengeluaran', dateFrom, dateTo),
    };
  }
}
