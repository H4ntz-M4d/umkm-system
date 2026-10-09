import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, prisma, ProductStatus, ProductType } from '@repo/db';
import { PublicProductQueryDto } from 'products/dto/public-product.dto';
import {
  publicCardVariantSelect,
  publicDetailVariantSelect,
  publicImageGroupSelect,
  publicVariantTypeSelect,
  toPublicProductCardResponse,
  toPublicProductDetailResponse,
} from './public-products.response';

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  type: true,
  categoryId: true,
  productPreOrderDetail: { select: { maxQuota: true, endDate: true } },
  categories: { select: { name: true } },
  variants: publicCardVariantSelect,
} satisfies Prisma.ProductMasterSelect;

/**
 * Tipe produk yang dijual lewat storefront — sejak READY_STOCK digabung ke
 * REGULAR, keduanya tampil. Daftarnya tetap dipertahankan supaya parameter
 * `?type=` dari luar tetap tersaring terhadap nilai yang sah.
 */
const PUBLIC_PRODUCT_TYPES = [
  ProductType.REGULAR,
  ProductType.PRE_ORDER,
] as const;

/**
 * Katalog storefront. Read-only dan tanpa guard, jadi filter status ACTIVE
 * dipasang mati di sini — bukan dari query — supaya produk DRAFT/NONACTIVE tidak
 * pernah bisa bocor lewat parameter. Penyaringan tipe produk mengikuti aturan
 * yang sama.
 */
@Injectable()
export class PublicProductsService {
  /**
   * Penyaring tipe selalu dibatasi `PUBLIC_PRODUCT_TYPES`.
   *
   * Nilai `?type=` yang tidak dikenal tidak menghasilkan apa-apa, bukan malah
   * membuka filter: nilai dari query hanya dipakai kalau memang termasuk yang
   * boleh dijual online, selain itu batas umumnya yang berlaku.
   */
  private buildTypeFilter(
    query: PublicProductQueryDto,
  ): Prisma.ProductMasterWhereInput {
    const requested = query.type ? ProductType[query.type] : null;

    if (
      requested &&
      (PUBLIC_PRODUCT_TYPES as readonly ProductType[]).includes(requested)
    ) {
      return { type: requested };
    }

    return { type: { in: [...PUBLIC_PRODUCT_TYPES] } };
  }

  private buildWhere(
    query: PublicProductQueryDto,
  ): Prisma.ProductMasterWhereInput {
    return {
      status: ProductStatus.ACTIVE,
      ...this.buildTypeFilter(query),
      ...(query.search?.trim() && {
        name: { contains: query.search.trim(), mode: 'insensitive' },
      }),
      ...(query.categoryId?.trim() && {
        categoryId: BigInt(query.categoryId),
      }),
    };
  }

  async findPublicProducts(query: PublicProductQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 12;
    const where = this.buildWhere(query);
    const sort = query.sort ?? 'newest';

    const total = await prisma.productMaster.count({ where });

    // Harga ada di ProductVariant, dan Prisma tidak bisa mengurutkan induk
    // berdasarkan agregat relasinya. Untuk sort harga, ambil semua yang cocok
    // lalu urutkan & potong di memori. Aman untuk katalog skala toko ini; kalau
    // jumlah produk tumbuh besar, ganti dengan query SQL ber-MIN(price).
    if (sort === 'price_asc' || sort === 'price_desc') {
      const data = await prisma.productMaster.findMany({
        where,
        select: cardSelect,
      });

      const sorted = data
        .map(toPublicProductCardResponse)
        .sort((a, b) =>
          sort === 'price_asc'
            ? Number(a.priceMin) - Number(b.priceMin)
            : Number(b.priceMin) - Number(a.priceMin),
        )
        .slice(skip, skip + limit);

      return {
        success: true,
        data: sorted,
        meta: { skip, limit, total, timeStamp: new Date().toISOString() },
      };
    }

    const data = await prisma.productMaster.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: cardSelect,
    });

    return {
      success: true,
      data: data.map(toPublicProductCardResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async findPublicProductBySlug(slug: string) {
    const data = await prisma.productMaster.findFirst({
      /// Tipe ikut disaring, bukan hanya di listing, supaya aturan halaman
      /// detail tidak pernah lebih longgar dari katalognya.
      where: {
        slug,
        status: ProductStatus.ACTIVE,
        type: { in: [...PUBLIC_PRODUCT_TYPES] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
        useVariant: true,
        categoryId: true,
        productPreOrderDetail: { select: { maxQuota: true, endDate: true } },
        categories: { select: { name: true } },
        variants: publicDetailVariantSelect,
        variantTypes: publicVariantTypeSelect,
        imageGroups: publicImageGroupSelect,
      },
    });

    if (!data) throw new BadRequestException('Produk tidak ditemukan');

    return toPublicProductDetailResponse(data);
  }
}
