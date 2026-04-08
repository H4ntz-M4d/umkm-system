import { BadRequestException, Injectable } from '@nestjs/common';
import { Pagination } from 'common/paginate/pagination';
import { Prisma, prisma, ProductStatus, ProductVariant } from '@repo/db';
import { CreateProductDto, UpdateProductDto } from 'products/dto/product.dto';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import {
  toAllProductsResponse,
  toProductResponse,
  toProductResponseById,
} from 'products/products/products.response';

@Injectable()
export class ProductsService {
  constructor(private cloudinaryService: CloudinaryService) {}

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  async findAll(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const data = await prisma.productMaster.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        useVariant: true,
        status: true,
        createdAt: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            cost: true,
            image: true,
            productVariantStocks: {
              select: {
                stock: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.productMaster.count();

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
        status: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            cost: true,
            image: true,
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
            values: {
              select: {
                id: true,
                value: true,
              },
            },
          },
        },
      },
    });

    return toProductResponseById(data!);
  }

  async create(data: CreateProductDto) {
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Prepare Status
      const statusMap: Record<string, ProductStatus> = {
        ACTIVE: ProductStatus.ACTIVE,
        NONACTIVE: ProductStatus.NONACTIVE,
        DRAFT: ProductStatus.DRAFT,
      };

      const status = statusMap[data.status] ?? ProductStatus.ACTIVE;

      const slugData = this.generateSlug(data.name);

      // 2. Create Product Master
      const product = await tx.productMaster.create({
        data: {
          name: data.name,
          description: data.description,
          useVariant: data.useVariant,
          status: status,
          slug: slugData,
        },
      });

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
        const typeValueMap = new Map<string, Map<string, bigint>>();

        for (const type of data.variantsTypes) {
          // Create Type (e.g., "Color")
          const createdType = await tx.productVariantType.create({
            data: {
              productMasterId: product.id,
              name: type.name,
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

          await tx.productVariant.create({
            data: {
              productMasterId: product.id,
              sku: variant.sku,
              price: variant.price,
              cost: variant.cost,
              isActive: true,
            },
          });
        }
      }

      const result = await tx.productMaster.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          description: true,
          useVariant: true,
          status: true,
          variants: {
            select: {
              id: true,
              sku: true,
              price: true,
              cost: true,
            },
          },
        },
      });

      return toProductResponse(result!);
    });
    return transaction;
  }

  async update(id: bigint, data: CreateProductDto) {
    const transaction = await prisma.$transaction(async (tx) => {
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

      const slugData = this.generateSlug(data.name);

      const statusMap: Record<string, ProductStatus> = {
        ACTIVE: ProductStatus.ACTIVE,
        NONACTIVE: ProductStatus.NONACTIVE,
        DRAFT: ProductStatus.DRAFT,
      };
      const status = statusMap[data.status] ?? existingProduct.status;

      // 2. Update Product Master
      await tx.productMaster.update({
        where: { id: id },
        data: {
          name: data.name,
          description: data.description,
          useVariant: data.useVariant,
          status,
          slug: slugData,
        },
      });

      const incomingVariants = (data.variants ?? [])
        .filter((v) => v.id)
        .map((v) => BigInt(v.id!));

      const removedVariants = existingProduct.variants.filter(
        (v) => !incomingVariants.includes(v.id),
      );

      console.log(incomingVariants);
      console.log(removedVariants);

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

        const typeValueMap = new Map<string, Map<string, bigint>>();

        for (const type of data.variantsTypes ?? []) {
          const createType = await tx.productVariantType.create({
            data: {
              productMasterId: id,
              name: type.name,
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

        for (const variant of data.variants ?? []) {
          let variantRecord: ProductVariant;

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
        }
      } else {
        for (const variant of data.variants ?? []) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: BigInt(variant.id) },
              data: {
                sku: variant.sku,
                price: variant.price,
                cost: variant.cost,
                isActive: true,
              },
            });
          } else {
            await tx.productVariant.create({
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
      }

      return {
        success: true,
        removedVariants: removedVariants,
      };
    });

    if (transaction.removedVariants && transaction.removedVariants.length > 0) {
      for (const rv of transaction.removedVariants) {
        if (rv.image) {
          try {
            await this.cloudinaryService.deleteImage(rv.image);
          } catch (error) {
            console.error(
              `Gagal menghapus gambar ${rv.image} di Cloudinary:`,
              error,
            );
          }
        }
      }
    }

    const result = await prisma.productMaster.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        description: true,
        useVariant: true,
        status: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            cost: true,
          },
        },
      },
    });

    return toProductResponse(result!);
  }

  async uploadImages(variantId: string[], file: Express.Multer.File[]) {
    if (variantId.length !== file.length) {
      throw new BadRequestException(
        'Jumlah variant harus sama dengan jumlah file',
      );
    }

    const result = await Promise.all(
      variantId.map(async (id, index) => {
        const existing = await prisma.productVariant.findUnique({
          where: { id: BigInt(id) },
          select: { image: true },
        });

        if (existing?.image) {
          await this.cloudinaryService.deleteImage(existing.image);
        }

        const imageUrl = await this.cloudinaryService.uploadImage(
          file[index],
          CloudinaryFolder.PRODUCTS,
        );

        return await prisma.productVariant.update({
          where: {
            id: BigInt(id),
          },
          data: {
            image: imageUrl,
          },
        });
      }),
    );

    return { success: true, data: result };
  }

  // async update(id: bigint, dto: UpdateProductDto) {
  //   return '';
  // }

  async remove(id: bigint) {
    const productIsExist = await prisma.productMaster.findUnique({
      where: { id: id },
      select: {
        variants: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    });

    if (!productIsExist) return null;

    const deleteImage = await Promise.allSettled(
      productIsExist.variants.map(async (variant) => {
        if (variant.image === null) return;
        await this.cloudinaryService.deleteImage(variant.image);
      }),
    );

    deleteImage.forEach((result) => {
      if (result.status === 'rejected') {
        console.log('Gagal menghapus gambar di cloudinary:', result.reason);
      }
    });

    const result = await prisma.productMaster.delete({
      where: { id: id },
      select: {
        id: true,
        name: true,
        description: true,
        useVariant: true,
        status: true,
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            cost: true,
          },
        },
      },
    });

    return toProductResponse(result);
  }
}
