import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import type { JwtPayload } from 'common/decorator/auth.decorator';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import {
  BlogCategoryDto,
  BlogDto,
  BlogQueryDto,
  PublicBlogQueryDto,
} from 'blog/dto/blog.dto';
import {
  blogInclude,
  toBlogCategoryResponse,
  toBlogDetailResponse,
  toBlogListResponse,
} from './blog.response';
import {
  collectBlogImages,
  excerptFromContent,
  sanitizeBlogContent,
} from './blog.sanitize';

@Injectable()
export class BlogService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  private buildWhere(query: BlogQueryDto): Prisma.BlogWhereInput {
    return {
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: BigInt(query.categoryId) }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { excerpt: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  async findAll(query: BlogQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: blogInclude,
      }),
      prisma.blog.count({ where }),
    ]);

    return {
      success: true,
      data: data.map(toBlogListResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async findOne(id: bigint) {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: blogInclude,
    });

    if (!blog) throw new NotFoundException('Tulisan tidak ditemukan');

    return {
      success: true,
      data: toBlogDetailResponse(blog),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /// Slug jadi bagian URL, jadi bentroknya dijawab dengan pesan yang jelas —
  /// bukan galat unik dari database yang tidak menyebut apa masalahnya.
  private async assertSlugFree(slug: string, exceptId?: bigint) {
    const existing = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing && existing.id !== exceptId) {
      throw new BadRequestException(
        `Slug "${slug}" sudah dipakai tulisan lain. Ubah sedikit judulnya atau slugnya.`,
      );
    }
  }

  /**
   * Menyiapkan isi tulisan sebelum disimpan.
   *
   * Isi dibersihkan lebih dulu, lalu ringkasannya diambil dari hasil yang
   * SUDAH bersih — supaya potongan teksnya tidak pernah membawa sisa markup
   * yang baru saja dibuang.
   */
  private prepareContent(data: BlogDto) {
    const content = sanitizeBlogContent(data.content);

    if (!content.trim()) {
      throw new BadRequestException(
        'Isi tulisan kosong setelah dibersihkan. Periksa kembali isinya.',
      );
    }

    return {
      content,
      excerpt: data.excerpt?.trim() || excerptFromContent(content),
    };
  }

  async create(data: BlogDto, actor: JwtPayload) {
    await this.assertSlugFree(data.slug);
    const { content, excerpt } = this.prepareContent(data);

    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt,
        content,
        coverImage: data.coverImage ?? null,
        keywords: data.keywords,
        status: data.status,
        /// Tanggal tayang diisi sekali saat pertama kali terbit.
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        categoryId: data.categoryId ? BigInt(data.categoryId) : null,
        userId: BigInt(actor.sub),
      },
      include: blogInclude,
    });

    return {
      success: true,
      data: toBlogDetailResponse(blog),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async update(id: bigint, data: BlogDto) {
    const isExisting = await prisma.blog.findUnique({
      where: { id },
      /// Isi dan sampul lama ikut dibaca supaya gambar yang dikeluarkan saat
      /// menyunting bisa dibuang dari Cloudinary.
      select: {
        id: true,
        publishedAt: true,
        content: true,
        coverImage: true,
      },
    });

    if (!isExisting) throw new NotFoundException('Tulisan tidak ditemukan');

    await this.assertSlugFree(data.slug, id);
    const { content, excerpt } = this.prepareContent(data);

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt,
        content,
        coverImage: data.coverImage ?? null,
        keywords: data.keywords,
        status: data.status,
        /**
         * Tanggal tayang tidak pernah diperbarui saat tulisan disunting:
         * mengubah isi bukan menerbitkan ulang. Yang mengisinya hanya
         * penerbitan pertama.
         */
        publishedAt:
          data.status === 'PUBLISHED'
            ? (isExisting.publishedAt ?? new Date())
            : isExisting.publishedAt,
        categoryId: data.categoryId ? BigInt(data.categoryId) : null,
      },
      include: blogInclude,
    });

    /**
     * Gambar yang tadinya dipakai tapi tidak ada lagi di versi baru.
     * Tanpa ini, tiap kali penulis mengganti sampul atau membuang gambar dari
     * isi tulisan, berkas lamanya tertinggal selamanya di Cloudinary.
     */
    const before = [
      ...(isExisting.coverImage ? [isExisting.coverImage] : []),
      ...collectBlogImages(isExisting.content),
    ];
    const after = new Set([
      ...(blog.coverImage ? [blog.coverImage] : []),
      ...collectBlogImages(blog.content),
    ]);

    await this.deleteUnusedImages(before.filter((url) => !after.has(url)));

    return {
      success: true,
      data: toBlogDetailResponse(blog),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Membuang gambar yang sudah tidak dirujuk tulisan mana pun.
   *
   * Dipanggil SETELAH baris tulisannya tersimpan/terhapus, supaya pengecekan
   * "masih dipakai" membaca keadaan yang sudah final. Satu gambar bisa saja
   * dipasang di dua tulisan — kalau masih ada yang memakainya, gambar itu
   * dibiarkan, karena menghapusnya akan merusak tulisan yang lain.
   *
   * Kegagalan di sini sengaja ditelan: berkas yatim di Cloudinary jauh lebih
   * ringan akibatnya daripada menggagalkan penyimpanan atau penghapusan yang
   * sudah terlanjur terjadi.
   */
  private async deleteUnusedImages(urls: string[]) {
    for (const url of urls) {
      const stillUsed = await prisma.blog.count({
        where: { OR: [{ coverImage: url }, { content: { contains: url } }] },
      });

      if (stillUsed > 0) continue;

      try {
        await this.cloudinaryService.deleteImage(url);
      } catch {
        // Dibiarkan: lihat catatan di atas.
      }
    }
  }

  /// Gambar sampul diunggah terpisah supaya form tidak perlu mengirim berkas
  /// dan isi tulisan sekaligus.
  async uploadCover(file: Express.Multer.File) {
    const image = await this.cloudinaryService.uploadImage(
      file,
      CloudinaryFolder.BLOGS,
    );

    return {
      success: true,
      data: { image },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async remove(id: bigint) {
    const blog = await prisma.blog.findUnique({
      where: { id },
      select: { id: true, coverImage: true, content: true },
    });

    if (!blog) throw new NotFoundException('Tulisan tidak ditemukan');

    await prisma.blog.delete({ where: { id } });

    /// Sampul DAN gambar di dalam isi tulisan ikut dibuang supaya tidak
    /// menumpuk tanpa ada yang menunjuk. Sampul yang juga dipasang di isi
    /// cukup dihapus sekali.
    await this.deleteUnusedImages([
      ...new Set([
        ...(blog.coverImage ? [blog.coverImage] : []),
        ...collectBlogImages(blog.content),
      ]),
    ]);

    return {
      success: true,
      data: { id },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  // --------------------------- Kategori blog ------------------------------

  async findCategories() {
    const data = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { blogs: true } } },
    });

    return {
      success: true,
      data: data.map(toBlogCategoryResponse),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async createCategory(data: BlogCategoryDto) {
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        `Slug kategori "${data.slug}" sudah dipakai.`,
      );
    }

    const category = await prisma.blogCategory.create({
      data,
      include: { _count: { select: { blogs: true } } },
    });

    return {
      success: true,
      data: toBlogCategoryResponse(category),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async removeCategory(id: bigint) {
    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { blogs: true } } },
    });

    if (!category) throw new NotFoundException('Kategori tidak ditemukan');

    if (category._count.blogs > 0) {
      throw new BadRequestException(
        `Kategori ini masih dipakai ${category._count.blogs} tulisan. Pindahkan tulisannya dulu.`,
      );
    }

    await prisma.blogCategory.delete({ where: { id } });

    return {
      success: true,
      data: { id },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  // ------------------------------ Publik ----------------------------------

  /**
   * Daftar tulisan untuk storefront.
   *
   * Hanya yang berstatus terbit — dan syarat itu ditulis di sini, bukan
   * diserahkan ke pemanggil, supaya draf tidak pernah bocor gara-gara satu
   * pemanggil lupa menyaringnya.
   */
  async findPublic(query: PublicBlogQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 9;

    const where: Prisma.BlogWhereInput = {
      status: 'PUBLISHED',
      ...(query.category && { category: { slug: query.category } }),
      /// Tag disimpan sebagai daftar teks, jadi dicocokkan dengan `has` —
      /// bukan pencarian teks bebas yang ikut mengenai tag lain yang
      /// kebetulan mengandung kata yang sama.
      ...(query.tag && { keywords: { has: query.tag } }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { excerpt: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: blogInclude,
      }),
      prisma.blog.count({ where }),
    ]);

    return {
      success: true,
      data: data.map(toBlogListResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async findPublicBySlug(slug: string) {
    const blog = await prisma.blog.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: blogInclude,
    });

    /// Draf dibalas "tidak ditemukan", bukan "belum terbit": keberadaan
    /// tulisan yang belum tayang pun bukan urusan pengunjung.
    if (!blog) throw new NotFoundException('Tulisan tidak ditemukan');

    return {
      success: true,
      data: toBlogDetailResponse(blog),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async findPublicCategories() {
    const data = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { blogs: { where: { status: 'PUBLISHED' } } } },
      },
    });

    /// Kategori tanpa tulisan terbit tidak ditawarkan sebagai penyaring:
    /// mengkliknya hanya menghasilkan halaman kosong.
    return {
      success: true,
      data: data
        .map(toBlogCategoryResponse)
        .filter((category) => category.blogCount > 0),
      meta: { timeStamp: new Date().toISOString() },
    };
  }
}
