import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { parseSignature, signatureForOptions } from '@repo/schemas';

export interface SyncVariantInput {
  id: bigint;
  options: Record<string, string>;
}

export interface SyncInput {
  variantsTypes: { name: string; isHaveVisual?: boolean }[];
  variants: SyncVariantInput[];
  /** Map<namaTipe, Map<namaNilai, valueId>> yang sudah dibangun create/update. */
  typeValueMap: Map<string, Map<string, bigint>>;
}

export interface SyncResult {
  groups: { id: bigint; signature: string }[];
  /** URL milik grup yatim. Dihapus dari Cloudinary oleh pemanggil SETELAH commit. */
  orphanedImageUrls: string[];
}

@Injectable()
export class ProductImageGroupService {
  /**
   * Merekonsiliasi Image Group milik satu produk dengan variant yang baru saja
   * dibuat atau diperbarui.
   *
   * Wajib dipanggil di dalam transaksi yang sama dengan pembuatan variant, sebab
   * ia menulis kolom imageGroupId pada variant tersebut.
   *
   * Grup di-upsert berdasarkan signature, bukan dibuat ulang. Inilah yang membuat
   * gambar selamat ketika admin hanya mengubah harga atau sku: signature-nya tidak
   * berubah, jadi baris grup dan gambarnya tetap sama.
   */
  async sync(
    tx: Prisma.TransactionClient,
    productMasterId: bigint,
    input: SyncInput,
  ): Promise<SyncResult> {
    const visualTypeNames = new Set(
      input.variantsTypes
        .filter((type) => type.isHaveVisual)
        .map((type) => type.name.trim()),
    );

    // 1. Kelompokkan variant menurut signature grupnya.
    const buckets = new Map<string, bigint[]>();
    for (const variant of input.variants) {
      const signature = signatureForOptions(variant.options, visualTypeNames);
      const bucket = buckets.get(signature);
      if (bucket) {
        bucket.push(variant.id);
      } else {
        buckets.set(signature, [variant.id]);
      }
    }

    const groups: { id: bigint; signature: string }[] = [];

    for (const [signature, variantIds] of buckets) {
      // 2. Upsert, bukan create: grup lama beserta gambarnya dipakai ulang.
      const group = await tx.productImageGroup.upsert({
        where: {
          productMasterId_signature: { productMasterId, signature },
        },
        create: { productMasterId, signature },
        update: {},
        select: { id: true },
      });

      // 3. Bangun ulang junction dari id nilai yang berlaku sekarang. Id ini
      //    berganti tiap simpan karena update() membuat ulang semua tipe dan
      //    nilai, itulah sebabnya signature berbasis nama, bukan id.
      const valueIds = parseSignature(signature)
        .map(([typeName, valueName]) =>
          input.typeValueMap.get(typeName)?.get(valueName),
        )
        .filter((valueId): valueId is bigint => valueId !== undefined);

      await tx.productImageGroupValue.deleteMany({
        where: { imageGroupId: group.id },
      });

      if (valueIds.length > 0) {
        // Duplikat tidak mungkin: junction grup ini baru saja dikosongkan, satu
        // signature tidak bisa memuat nama tipe yang sama dua kali, dan dua tipe
        // berbeda selalu punya ProductVariantValue yang berbeda pula.
        await tx.productImageGroupValue.createMany({
          data: valueIds.map((variantValueId) => ({
            imageGroupId: group.id,
            variantValueId,
          })),
        });
      }

      // 4. Arahkan variant sekelompok ke grup ini dalam satu statement.
      await tx.productVariant.updateMany({
        where: { id: { in: variantIds } },
        data: { imageGroupId: group.id },
      });

      groups.push({ id: group.id, signature });
    }

    // 5. Sapu grup yang tidak lagi punya variant. Terjadi saat admin mengubah
    //    toggle isHaveVisual, menghapus nilai variant, atau mengganti nama.
    const keepIds = groups.map((group) => group.id);
    const orphans = await tx.productImageGroup.findMany({
      where: {
        productMasterId,
        ...(keepIds.length > 0 && { id: { notIn: keepIds } }),
      },
      select: { id: true, images: { select: { image: true } } },
    });

    if (orphans.length > 0) {
      await tx.productImageGroup.deleteMany({
        where: { id: { in: orphans.map((orphan) => orphan.id) } },
      });
    }

    return {
      groups,
      orphanedImageUrls: orphans.flatMap((orphan) =>
        orphan.images.map((image) => image.image),
      ),
    };
  }
}
