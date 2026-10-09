import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import { BankAccountSchema, QrisAccountSchema } from '@repo/schemas';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import { PaymentMethodDto } from 'payment/payment.dto';
import { toPaymentResponse, toPaymentResponseOnly } from './payment.response';

@Injectable()
export class PaymentService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Metode yang boleh dipakai satu toko: miliknya sendiri, ditambah yang
   * berlaku umum (storeId kosong, mis. tunai).
   *
   * Ditulis sekali di sini karena dipakai tiga tempat — daftar untuk kasir,
   * pemeriksaan saat transaksi dibuat, dan pemilihan metode pesanan online —
   * dan ketiganya harus memakai aturan yang sama persis.
   */
  static storeFilter(storeId: bigint): Prisma.PaymentMethodWhereInput {
    return { OR: [{ storeId: null }, { storeId }] };
  }

  async findAll(storeId?: bigint) {
    const data = await prisma.paymentMethod.findMany({
      /**
       * Penyaringan toko hanya diminta layar transaksi (kasir dan dialog
       * pesanan), dan di sana metode nonaktif tidak boleh ikut tampil —
       * sebelumnya ikut, sehingga metode yang sudah dimatikan masih bisa
       * dipilih kasir. Layar pengelolaan memanggil tanpa toko dan tetap
       * menerima semuanya, karena di sanalah metode dinonaktifkan dan
       * dinyalakan kembali.
       */
      where: storeId
        ? { ...PaymentService.storeFilter(storeId), isActive: true }
        : undefined,
      include: {
        bankAccount: true,
        qrisAccount: true,
        store: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    });
    return data.map(toPaymentResponse);
  }

  /// Toko yang dituju harus benar-benar ada; id ngawur dari body lebih baik
  /// ditolak dengan pesan jelas daripada gagal sebagai galat kunci asing.
  private async resolveStoreId(storeId?: string | null) {
    if (!storeId) return null;

    const store = await prisma.store.findUnique({
      where: { id: BigInt(storeId) },
      select: { id: true },
    });

    if (!store) throw new BadRequestException('Toko tidak ditemukan.');

    return store.id;
  }

  async create(data: PaymentMethodDto) {
    const storeId = await this.resolveStoreId(data.storeId);

    const payment = await prisma.paymentMethod.create({
      data: {
        name: data.name,
        channel: data.channel,
        isActive: data.isActive,
        storeId,
      },
    });

    if (data.channel === 'BANK_TRANSFER') {
      const bankData = BankAccountSchema.parse(data.bankAccount);
      await prisma.bankAccount.create({
        data: {
          paymentMethodId: payment.id,
          bankName: payment.name,
          accountName: bankData.accountName,
          accountNumber: bankData.accountNumber,
        },
      });
    }

    if (data.channel === 'QRIS_STATIC') {
      const qrisData = QrisAccountSchema.parse(data.qrisAccount);
      await prisma.qrisAccount.create({
        data: {
          paymentMethodId: payment.id,
          merchantName: qrisData.merchantName,
          qrImage: qrisData.qrImage,
        },
      });
    }

    return toPaymentResponseOnly(payment);
  }

  async update(id: bigint, data: PaymentMethodDto) {
    const storeId = await this.resolveStoreId(data.storeId);

    const payment = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        channel: data.channel,
        isActive: data.isActive,
        storeId,
      },
    });

    if (data.channel === 'BANK_TRANSFER') {
      const bankData = BankAccountSchema.parse(data.bankAccount);
      await prisma.bankAccount.update({
        where: { paymentMethodId: id },
        data: {
          paymentMethodId: payment.id,
          bankName: payment.name,
          accountName: bankData.accountName,
          accountNumber: bankData.accountNumber,
        },
      });
    }

    if (data.channel === 'QRIS_STATIC') {
      const qrisData = QrisAccountSchema.parse(data.qrisAccount);
      /// upsert, bukan update: metode yang tadinya channel lain lalu diubah
      /// jadi QRIS belum punya baris detailnya.
      await prisma.qrisAccount.upsert({
        where: { paymentMethodId: id },
        create: {
          paymentMethodId: payment.id,
          merchantName: qrisData.merchantName,
          qrImage: qrisData.qrImage,
        },
        update: {
          merchantName: qrisData.merchantName,
          qrImage: qrisData.qrImage,
        },
      });
    }

    return toPaymentResponseOnly(payment);
  }

  /// Gambar QR diunggah terpisah supaya penyimpanan metode pembayaran tidak
  /// ikut menunggu unggahan selesai — pola yang sama dengan sampul blog.
  async uploadQrImage(file: Express.Multer.File) {
    const image = await this.cloudinaryService.uploadImage(
      file,
      CloudinaryFolder.QRIS,
    );

    return {
      success: true,
      data: { image },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async remove(id: bigint) {
    const payment = await prisma.paymentMethod.delete({ where: { id } });
    return toPaymentResponseOnly(payment);
  }
}

/**
 * Memastikan metode pembayaran memang boleh dipakai toko tersebut.
 *
 * Menyembunyikan pilihan di layar saja tidak cukup: permintaan bisa dikirim
 * langsung ke API dengan id metode milik toko lain, dan akibatnya uang tercatat
 * masuk ke rekening yang salah.
 */
export async function assertPaymentMethodForStore(
  paymentMethodId: bigint,
  storeId: bigint,
) {
  const method = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, ...PaymentService.storeFilter(storeId) },
    select: { id: true },
  });

  if (!method) {
    throw new BadRequestException(
      'Metode pembayaran ini bukan milik toko tempat transaksi berlangsung.',
    );
  }
}
