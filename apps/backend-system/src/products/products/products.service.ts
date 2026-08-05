import { BadRequestException, Injectable } from '@nestjs/common';
import { Pagination } from 'common/paginate/pagination';
import {
  Prisma,
  prisma,
  ProductStatus,
  ProductType,
  ProductVariant,
} from '@repo/db';
import { CreateProductDto } from 'products/dto/product.dto';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import {
  toAllProductsResponse,
  toProductListResponse,
  toProductResponse,
  toProductResponseById,
  toProductVariantListResponse,
  variantImageGroupSelect,
} from 'products/products/products.response';
import {
  ProductImageGroupService,
  SyncVariantInput,
} from 'products/products/product-image-group.service';
import { ProductPreOrderDetailSchema } from '@repo/schemas';

/** Select penutup create/update: yang dibutuhkan toProductResponse. */
const mutationResultSelect = {
  id: true,
  name: true,
  description: true,
  useVariant: true,
  categoryId: true,
  type: true,
  status: true,
  variants: {
    select: {
      id: true,
      sku: true,
      price: true,
      cost: true,
    },
  },
  imageGroups: {
    select: {
      id: true,
      signature: true,
    },
  },
} satisfies Prisma.ProductMasterSelect;

@Injectable()
export class ProductsService {
  constructor(
    private cloudinaryService: CloudinaryService,
    private imageGroups: ProductImageGroupService,
  ) {}

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Menyeragamkan spasi pada nama tipe, nilai variant, dan key options.
   *
   * canonicalSignature melakukan trim saat membentuk signature. Kalau sumbernya
   * tidak ikut di-trim, typeValueMap akan dikunci "Warna " sementara signature
   * berisi "Warna", lookup meleset, dan junction terisi kosong tanpa error apa
   * pun. Dinormalkan sekali di sini supaya baris database, typeValueMap, options,
   * dan signature semuanya berangkat dari nilai yang sama.
   */
  private normalizeVariantInput(data: CreateProductDto): CreateProductDto {
    return {
      ...data,
      variantsTypes: data.variantsTypes?.map((type) => ({
        ...type,
        name: type.name.trim(),
        values: type.values.map((value) => value.trim()),
      })),
      variants: data.variants?.map((variant) => ({
        ...variant,
        options: Object.fromEntries(
          Object.entries(variant.options ?? {}).map(([typeName, valueName]) => [
            typeName.trim(),
            valueName.trim(),
          ]),
        ),
      })),
    };
  }

  /**
   * Fitur yang memegang referensi ke sebuah variant, beserta sebutannya untuk
   * admin. orderItems dan posTransactionItems memakai FK Restrict, jadi
   * penghapusan ditolak database dengan P2003 yang tidak berarti apa-apa bagi
   * admin. productions memakai SetNull, tidak menolak, tapi riwayat produksinya
   * akan kehilangan tautan ke variant, jadi tetap harus ditahan.
   */
  private static readonly VARIANT_USAGE_LABELS = {
    orderItems: 'pesanan online',
    posTransactionItems: 'transaksi kasir',
    productions: 'produksi',
  } as const;

  /**
   * Menolak operasi yang akan menghapus variant yang masih dipakai fitur lain,
   * dengan pesan yang menyebutkan SKU dan fitur pemakainya.
   */
  private async assertVariantsNotInUse(
    variantIds: bigint[],
    reason: string,
  ): Promise<void> {
    if (variantIds.length === 0) return;

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        sku: true,
        _count: {
          select: {
            orderItems: true,
            posTransactionItems: true,
            productions: true,
          },
        },
      },
    });

    const labels = ProductsService.VARIANT_USAGE_LABELS;
    const inUse = variants
      .map((variant) => ({
        sku: variant.sku,
        usedIn: (Object.keys(labels) as (keyof typeof labels)[])
          .filter((feature) => variant._count[feature] > 0)
          .map((feature) => labels[feature]),
      }))
      .filter((variant) => variant.usedIn.length > 0);

    if (inUse.length === 0) return;

    const detail = inUse
      .map(
        (variant) =>
          `${variant.sku} (dipakai di ${variant.usedIn.join(' dan ')})`,
      )
      .join('; ');

    throw new BadRequestException(
      `${reason} Variant yang terkunci: ${detail}. ` +
        'Riwayat transaksi dan produksi akan rusak bila variant ini dihapus. ' +
        'Bila variant tersebut sudah tidak dijual, nonaktifkan saja dari halaman daftar produk.',
    );
  }

  // =============================== Function Get Data =======================================

  async findAll(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const where: Prisma.ProductMasterWhereInput = {
      name: {
        contains: search,
        mode: 'insensitive',
      },
    };

    const data = await prisma.productMaster.findMany({
      skip: skip,
      take: limit ?? 10,
      where,
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        useVariant: true,
        categoryId: true,
        type: true,
        status: true,
        createdAt: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            cost: true,
            imageGroupId: true,
            imageGroup: variantImageGroupSelect,
            productVariantStocks: {
              select: {
                stock: true,
              },
            },
          },
        },
      },
    });

    // Filter yang sama dengan findMany, kalau tidak meta.total salah saat search.
    const total = await prisma.productMaster.count({ where });

    const result = data.map(toAllProductsResponse);
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

  async productById(id: bigint) {
    const data = await prisma.productMaster.findFirst({
      where: { id: id },
      select: {
        name: true,
        description: true,
        useVariant: true,
        categoryId: true,
        type: true,
        status: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            cost: true,
            imageGroupId: true,
            imageGroup: variantImageGroupSelect,
            options: {
              select: {
                variantValue: {
                  select: {
                    value: true,
                    variantType: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        variantTypes: {
          select: {
            id: true,
            name: true,
            isHaveVisual: true,
            values: {
              select: {
                id: true,
                value: true,
              },
            },
          },
        },
        imageGroups: {
          select: {
            id: true,
            signature: true,
            values: {
              select: {
                variantValue: {
                  select: {
                    id: true,
                    value: true,
                    variantType: { select: { name: true } },
                  },
                },
              },
            },
            images: {
              select: { id: true, image: true, sortOrder: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { id: 'asc' },
        },
        productPreOrderDetail: true,
      },
    });

    if (!data) {
      throw new BadRequestException('Product tidak ditemukan');
    }

    return toProductResponseById(data);
  }

  async findProductVariantsList() {
    const data = await prisma.productMaster.findMany({
      select: {
        id: true,
        name: true,
        variants: {
          select: {
            id: true,
            sku: true,
          },
        },
      },
    });

    const result = data.map(toProductVariantListResponse);
    return result;
  }

  async getProductList(search?: string, categoryId?: string) {
    const dynamicFilters = [
      search?.trim() && { name: { contains: search, mode: 'insensitive' } },
      categoryId?.trim() && {
        categories: { id: BigInt(categoryId) },
      },
    ].filter(Boolean) as Prisma.ProductMasterWhereInput[];

    const data = await prisma.productMaster.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        variants: {
          some: {
            productVariantStocks: {
              stock: {
                gt: 0,
              },
            },
          },
        },
        ...(dynamicFilters.length > 0 && { AND: dynamicFilters }),
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        useVariant: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            imageGroupId: true,
            imageGroup: variantImageGroupSelect,
            productVariantStocks: {
              select: {
                stock: true,
              },
            },
            options: {
              select: {
                productVariantId: true,
                variantValueId: true,
                variantValue: {
                  select: {
                    value: true,
                  },
                },
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    const formattedData = data.map(toProductListResponse);

    return {
      success: true,
      data: formattedData,
      meta: {
        timeStamp: new Date().toISOString(),
      },
    };
  }

  // =============================== Function Mutation Data =======================================

  async create(rawData: CreateProductDto) {
    const data = this.normalizeVariantInput(rawData);

    const transaction = await prisma.$transaction(async (tx) => {
      // Dikumpulkan sepanjang kedua cabang, lalu diserahkan ke resolver grup.
      const syncVariants: SyncVariantInput[] = [];
      const typeValueMap = new Map<string, Map<string, bigint>>();

      // 1. Prepare Status
      const statusMap: Record<string, ProductStatus> = {
        ACTIVE: ProductStatus.ACTIVE,
        NONACTIVE: ProductStatus.NONACTIVE,
        DRAFT: ProductStatus.DRAFT,
      };

      const status = statusMap[data.status] ?? ProductStatus.ACTIVE;

      const typeMap: Record<string, ProductType> = {
        READY_STOCK: ProductType.READY_STOCK,
        MADE_TO_ORDER: ProductType.MADE_TO_ORDER,
        PRE_ORDER: ProductType.PRE_ORDER,
      };

      const typeData = typeMap[data.type] ?? ProductType.READY_STOCK;

      const slugData = this.generateSlug(data.name);

      // 2. Create Product Master
      const product = await tx.productMaster.create({
        data: {
          name: data.name,
          description: data.description,
          useVariant: data.useVariant,
          categoryId: BigInt(data.categoryId),
          type: typeData,
          status: status,
          slug: slugData,
        },
      });

      if (typeData === 'PRE_ORDER') {
        const productPreOrderDetailSchema = ProductPreOrderDetailSchema.parse(
          data.productPreOrderDetail,
        );
        await tx.productPreOrderDetails.create({
          data: {
            productMasterId: product.id,
            quotaTarget: productPreOrderDetailSchema.quotaTarget,
            maxQuota: productPreOrderDetailSchema.maxQuota,
            endDate: productPreOrderDetailSchema.endDate,
          },
        });
      }

      // 3. Handle Variants
      if (data.useVariant) {
        if (
          !data.variants ||
          !data.variantsTypes ||
          data.variants.length === 0 ||
          data.variantsTypes.length === 0
        ) {
          throw new BadRequestException(
            'Variants and Variant Types are required when useVariant is true',
          );
        }

        // 3a. Create Variant Types and Values, and map them
        // Structure: Map<TypeName, Map<ValueName, ValueId>>
        for (const type of data.variantsTypes) {
          // Create Type (e.g., "Color")
          const createdType = await tx.productVariantType.create({
            data: {
              productMasterId: product.id,
              name: type.name,
              isHaveVisual: type.isHaveVisual ?? false,
            },
          });

          const valueMap = new Map<string, bigint>();
          for (const value of type.values) {
            // Create Value (e.g., "Red") linked to Type
            const createdValue = await tx.productVariantValue.create({
              data: {
                variantTypeId: createdType.id,
                value: value,
              },
            });
            valueMap.set(value, createdValue.id);
          }
          typeValueMap.set(type.name, valueMap);
        }

        for (const variant of data.variants) {
          for (const typeName of typeValueMap.keys()) {
            if (!(typeName in variant.options)) {
              throw new BadRequestException(
                `Variant '${variant.sku}' is missing required option '${typeName}'`,
              );
            }
          }
        }

        // 3b. Create Variants (SKUs) and Link Options
        const sku = data.variants.map((v) => v.sku);
        const uniqueSku = new Set(sku);

        for (const variant of data.variants) {
          if (sku.length !== uniqueSku.size) {
            throw new BadRequestException('Duplicate SKU found in variants');
          }

          const createdVariant = await tx.productVariant.create({
            data: {
              productMasterId: product.id,
              sku: variant.sku,
              price: variant.price,
              cost: variant.cost,
              isActive: true,
            },
          });

          const optionToCreate: Prisma.ProductVariantOptionCreateManyInput[] =
            [];

          // Link Options (e.g., "Color": "Red")
          for (const [typeName, valueName] of Object.entries(variant.options)) {
            const valueId = typeValueMap.get(typeName)?.get(valueName);

            if (!valueId) {
              throw new BadRequestException(
                `Variant option value '${valueName}' for type '${typeName}' is not defined in variant types.`,
              );
            }

            optionToCreate.push({
              productVariantId: createdVariant.id,
              variantValueId: valueId,
            });
          }

          await tx.productVariantOption.createMany({
            data: optionToCreate,
          });

          await tx.productVariantStock.create({
            data: {
              productVariantId: createdVariant.id,
              stock: 0,
              reserved_stock: 0,
            },
          });

          syncVariants.push({
            id: createdVariant.id,
            options: variant.options,
          });
        }
      } else {
        if (!data.variants || data.variants.length === 0) {
          throw new BadRequestException('Detail Product are required');
        }

        for (const variant of data.variants) {
          const skuCheck = await tx.productVariant.findUnique({
            where: { sku: variant.sku },
          });

          if (skuCheck) {
            throw new BadRequestException(
              'SKU sudah di gunakan di sebuah variant',
            );
          }

          const pv = await tx.productVariant.create({
            data: {
              productMasterId: product.id,
              sku: variant.sku,
              price: variant.price,
              cost: variant.cost,
              isActive: true,
            },
          });

          await tx.productVariantStock.create({
            data: {
              productVariantId: pv.id,
              stock: 0,
              reserved_stock: 0,
            },
          });

          syncVariants.push({ id: pv.id, options: {} });
        }
      }

      // Bentuk Image Group dan tautkan tiap variant ke grupnya. Saat create tidak
      // pernah ada grup yatim, jadi orphanedImageUrls selalu kosong.
      await this.imageGroups.sync(tx, product.id, {
        variantsTypes: data.variantsTypes ?? [],
        variants: syncVariants,
        typeValueMap,
      });

      const result = await tx.productMaster.findUnique({
        where: { id: product.id },
        select: mutationResultSelect,
      });

      return toProductResponse(result!);
    });
    return transaction;
  }

  async update(id: bigint, rawData: CreateProductDto) {
    const data = this.normalizeVariantInput(rawData);

    const existingProduct = await prisma.productMaster.findUnique({
      where: { id: id },
      include: {
        variants: true,
        variantTypes: true,
      },
    });

    if (!existingProduct) {
      throw new BadRequestException('Product tidak di temukan');
    }

    const existingTypesNames = existingProduct.variantTypes
      .map((vt) => vt.name)
      .sort();

    const incomingTypesNames = (data.variantsTypes ?? [])
      .map((vt) => vt.name)
      .sort();

    const isStructuralChange =
      JSON.stringify(existingTypesNames) !== JSON.stringify(incomingTypesNames);

    if (isStructuralChange && data.useVariant) {
      // Mengubah tipe variant membuat SELURUH variant dibuat ulang, jadi semuanya
      // harus bebas referensi, bukan hanya yang hilang dari form.
      await this.assertVariantsNotInUse(
        existingProduct.variants.map((variant) => variant.id),
        'Tipe variant tidak dapat diubah karena produk ini sudah digunakan di fitur lain. ' +
          'Untuk saat ini hanya harga, biaya, dan SKU yang dapat diubah.',
      );
    }

    const incomingVariantIds = (data.variants ?? [])
      .filter((variant) => variant.id)
      .map((variant) => BigInt(variant.id!));

    const removedVariants = existingProduct.variants.filter(
      (variant) => !incomingVariantIds.includes(variant.id),
    );

    // Diperiksa sebelum transaksi dibuka supaya gagal cepat, dan supaya admin
    // dapat pesan yang jelas alih-alih P2003 mentah dari database.
    await this.assertVariantsNotInUse(
      removedVariants.map((variant) => variant.id),
      'Variant tidak dapat dihapus karena sudah digunakan di fitur lain.',
    );

    const transaction = await prisma.$transaction(async (tx) => {
      // Dikumpulkan sepanjang kedua cabang, lalu diserahkan ke resolver grup.
      const syncVariants: SyncVariantInput[] = [];
      const typeValueMap = new Map<string, Map<string, bigint>>();

      const slugData = this.generateSlug(data.name);

      const statusMap: Record<string, ProductStatus> = {
        ACTIVE: ProductStatus.ACTIVE,
        NONACTIVE: ProductStatus.NONACTIVE,
        DRAFT: ProductStatus.DRAFT,
      };
      const status = statusMap[data.status] ?? existingProduct.status;

      const typeMap: Record<string, ProductType> = {
        READY_STOCK: ProductType.READY_STOCK,
        MADE_TO_ORDER: ProductType.MADE_TO_ORDER,
        PRE_ORDER: ProductType.PRE_ORDER,
      };

      const typeData = typeMap[data.type] ?? ProductType.READY_STOCK;

      // 2. Update Product Master
      await tx.productMaster.update({
        where: { id: id },
        data: {
          name: data.name,
          description: data.description,
          useVariant: data.useVariant,
          categoryId: BigInt(data.categoryId),
          type: typeData,
          status: status,
          slug: slugData,
        },
      });

      if (typeData === 'PRE_ORDER') {
        const preOrderProductSchema = ProductPreOrderDetailSchema.parse(
          data.productPreOrderDetail,
        );
        await tx.productPreOrderDetails.upsert({
          where: { productMasterId: id },
          create: {
            productMasterId: id,
            quotaTarget: preOrderProductSchema.quotaTarget,
            maxQuota: preOrderProductSchema.maxQuota,
            endDate: preOrderProductSchema.endDate,
          },
          update: {
            quotaTarget: preOrderProductSchema.quotaTarget,
            maxQuota: preOrderProductSchema.maxQuota,
            endDate: preOrderProductSchema.endDate,
          },
        });
      }

      if (removedVariants.length > 0) {
        const removedId = removedVariants.map((v) => v.id);

        await tx.productVariant.deleteMany({
          where: {
            id: {
              in: removedId,
            },
          },
        });
      }

      if (data.useVariant) {
        await tx.productVariantType.deleteMany({
          where: { productMasterId: id },
        });

        for (const type of data.variantsTypes ?? []) {
          const createType = await tx.productVariantType.create({
            data: {
              productMasterId: id,
              name: type.name,
              isHaveVisual: type.isHaveVisual ?? false,
            },
          });

          const valueMap = new Map<string, bigint>();
          for (const value of type.values) {
            const createdVariantValue = await tx.productVariantValue.create({
              data: {
                variantTypeId: createType.id,
                value: value,
              },
            });
            valueMap.set(value, createdVariantValue.id);
          }
          typeValueMap.set(type.name, valueMap);
        }

        if (isStructuralChange) {
          await tx.productVariant.deleteMany({
            where: { productMasterId: id },
          });
        }

        for (const variant of data.variants ?? []) {
          let variantRecord: ProductVariant;

          if (isStructuralChange) {
            variantRecord = await tx.productVariant.create({
              data: {
                productMasterId: id,
                sku: variant.sku,
                price: variant.price,
                cost: variant.cost,
                isActive: true,
              },
            });

            await tx.productVariantOption.deleteMany({
              where: { productVariantId: variantRecord.id },
            });
          } else {
            if (variant.id) {
              variantRecord = await tx.productVariant.update({
                where: { id: BigInt(variant.id) },
                data: {
                  sku: variant.sku,
                  price: variant.price,
                  cost: variant.cost,
                },
              });

              await tx.productVariantOption.deleteMany({
                where: { productVariantId: variantRecord.id },
              });
            } else {
              variantRecord = await tx.productVariant.create({
                data: {
                  productMasterId: id,
                  sku: variant.sku,
                  price: variant.price,
                  cost: variant.cost,
                  isActive: true,
                },
              });
            }
          }

          const optionsToCreate: Prisma.ProductVariantOptionCreateManyInput[] =
            [];
          for (const [typeName, valueName] of Object.entries(
            variant.options ?? {},
          )) {
            const valueId = typeValueMap.get(typeName)?.get(valueName);
            if (!valueId) {
              throw new BadRequestException(
                `Variant option value '${valueName}' for type '${typeName}' is not defined.`,
              );
            }
            optionsToCreate.push({
              productVariantId: variantRecord.id,
              variantValueId: valueId,
            });
          }

          await tx.productVariantOption.createMany({
            data: optionsToCreate,
          });

          syncVariants.push({
            id: variantRecord.id,
            options: variant.options ?? {},
          });
        }
      } else {
        for (const variant of data.variants ?? []) {
          let variantRecord: ProductVariant;

          if (variant.id) {
            variantRecord = await tx.productVariant.update({
              where: { id: BigInt(variant.id) },
              data: {
                sku: variant.sku,
                price: variant.price,
                cost: variant.cost,
                isActive: true,
              },
            });
          } else {
            variantRecord = await tx.productVariant.create({
              data: {
                productMasterId: id,
                sku: variant.sku,
                price: variant.price,
                cost: variant.cost,
                isActive: true,
              },
            });
          }

          syncVariants.push({ id: variantRecord.id, options: {} });
        }
      }

      // Rekonsiliasi grup berjalan terlepas dari isStructuralChange, sehingga
      // perubahan toggle isHaveVisual pun ikut tertangani. Grup dengan signature
      // yang sama di-upsert, jadi edit harga tidak menyentuh gambar.
      const { orphanedImageUrls } = await this.imageGroups.sync(tx, id, {
        variantsTypes: data.variantsTypes ?? [],
        variants: syncVariants,
        typeValueMap,
      });

      return {
        success: true,
        removedVariants: removedVariants,
        orphanedImageUrls,
      };
    });

    // Aset grup yatim dibersihkan setelah commit, bukan di dalam transaksi.
    const deletedImages = await Promise.allSettled(
      transaction.orphanedImageUrls.map((url) =>
        this.cloudinaryService.deleteImage(url),
      ),
    );

    deletedImages.forEach((deleted) => {
      if (deleted.status === 'rejected') {
        console.error(
          'Gagal menghapus gambar grup yatim di Cloudinary:',
          deleted.reason,
        );
      }
    });

    const result = await prisma.productMaster.findUnique({
      where: { id: id },
      select: mutationResultSelect,
    });

    return toProductResponse(result!);
  }

  async uploadGroupImages(
    productMasterId: bigint,
    groupIds: string[],
    files: Express.Multer.File[],
  ) {
    if (groupIds.length !== files.length) {
      throw new BadRequestException(
        'Jumlah image group harus sama dengan jumlah file',
      );
    }

    if (groupIds.length === 0) {
      return { success: true, data: [] };
    }

    const ids = groupIds.map((groupId) => BigInt(groupId));

    if (new Set(groupIds).size !== ids.length) {
      throw new BadRequestException('Terdapat image group yang duplikat');
    }

    // Grup wajib milik produk di path. Endpoint lama menerima :id tapi tidak
    // pernah memakainya, sehingga gambar produk lain bisa ditimpa.
    const owned = await prisma.productImageGroup.findMany({
      where: { id: { in: ids }, productMasterId },
      select: { id: true, images: { select: { image: true } } },
    });

    if (owned.length !== ids.length) {
      throw new BadRequestException('Image group tidak valid untuk produk ini');
    }

    const staleUrlsByGroup = new Map(
      owned.map((group) => [group.id, group.images.map((img) => img.image)]),
    );

    const staleUrls: string[] = [];
    const data = await Promise.all(
      ids.map(async (imageGroupId, index) => {
        // Upload dulu, baru sentuh database. Kalau upload gagal, gambar lama
        // yang masih baik tidak ikut hancur.
        const image = await this.cloudinaryService.uploadImage(
          files[index],
          CloudinaryFolder.PRODUCTS,
        );

        await prisma.$transaction(async (tx) => {
          await tx.productImage.deleteMany({ where: { imageGroupId } });
          await tx.productImage.create({
            data: { imageGroupId, image, sortOrder: 0 },
          });
        });

        staleUrls.push(...(staleUrlsByGroup.get(imageGroupId) ?? []));
        return { imageGroupId, image };
      }),
    );

    const deletedImages = await Promise.allSettled(
      staleUrls.map((url) => this.cloudinaryService.deleteImage(url)),
    );

    deletedImages.forEach((deleted) => {
      if (deleted.status === 'rejected') {
        console.error(
          'Gagal menghapus gambar lama di Cloudinary:',
          deleted.reason,
        );
      }
    });

    return { success: true, data };
  }

  async remove(id: bigint) {
    const productIsExist = await prisma.productMaster.findUnique({
      where: { id: id },
      select: {
        imageGroups: {
          select: {
            images: { select: { image: true } },
          },
        },
      },
    });

    if (!productIsExist) return null;

    const imageUrls = productIsExist.imageGroups.flatMap((group) =>
      group.images.map((image) => image.image),
    );

    const deleteImage = await Promise.allSettled(
      imageUrls.map((url) => this.cloudinaryService.deleteImage(url)),
    );

    deleteImage.forEach((result) => {
      if (result.status === 'rejected') {
        console.log('Gagal menghapus gambar di cloudinary:', result.reason);
      }
    });

    const result = await prisma.productMaster.delete({
      where: { id: id },
      select: mutationResultSelect,
    });

    return toProductResponse(result);
  }
}
