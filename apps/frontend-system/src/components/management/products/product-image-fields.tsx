"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XIcon } from "lucide-react";
import Image from "next/image";
import UploadImage from "@/assets/upload-image.png";
import type { VisualGroup } from "@/hooks/management/products/use-product-image-groups";

interface ProductImageFieldsProps {
  groups: VisualGroup[];
  /** URL yang sedang tampil untuk sebuah grup: blob lokal, atau gambar tersimpan. */
  previewFor: (signature: string) => string | undefined;
  onPick: (signature: string, file: File) => void;
  onClear: (signature: string) => void;
}

/**
 * Satu picker per grup visual, bukan per kombinasi variant.
 *
 * Warna visual + Ukuran non-visual menghasilkan 2 picker, bukan 6. Daftar grup
 * diturunkan dari variant yang benar-benar ada, jadi kombinasi yang sudah
 * dihapus admin tidak menyisakan picker yang filenya akan terbuang.
 */
export default function ProductImageFields({
  groups,
  previewFor,
  onPick,
  onClear,
}: ProductImageFieldsProps) {
  const isCompact = groups.length > 1;
  const boxSize = isCompact ? "h-24 w-24" : "h-50 w-50";

  return (
    <Card className={"shadow-sm bg-primary-foreground space-y-5"}>
      <CardContent className={"py-2 px-5"}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend
              className={"font-display data-[variant=legend]:text-xl"}
            >
              Foto Produk
            </FieldLegend>
            <FieldDescription className={"text-sm text-secondary"}>
              {isCompact
                ? "Unggah satu foto untuk tiap kombinasi yang tampilannya berbeda."
                : "Tandai tipe variant sebagai punya foto berbeda bila ingin foto terpisah per warna atau motif."}
            </FieldDescription>

            <div className={isCompact ? "flex flex-wrap gap-5 mt-4" : "mt-4"}>
              {groups.map((group) => {
                const preview = previewFor(group.signature);

                return (
                  <div key={group.signature} className={"flex flex-col gap-2"}>
                    <div className={"relative"}>
                      <div
                        className={`${boxSize} border border-dashed rounded-md flex justify-center items-center overflow-hidden bg-accent`}
                      >
                        <Label
                          className={`hover:bg-black/10 ${boxSize} rounded-md absolute cursor-pointer`}
                        >
                          <Input
                            type={"file"}
                            accept={"image/png,image/jpeg,image/webp"}
                            className={"hidden"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              onPick(group.signature, file);
                            }}
                          />
                        </Label>
                        {preview ? (
                          // blob: URL tidak bisa lewat next/image, jadi img biasa.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className={`${boxSize} object-cover rounded-md`}
                            src={preview}
                            alt={group.label}
                          />
                        ) : (
                          <Image
                            className={"h-10 w-10 object-cover"}
                            src={UploadImage}
                            alt={"Upload Image"}
                          />
                        )}
                      </div>
                      {preview && (
                        <button
                          type={"button"}
                          aria-label={`Hapus foto ${group.label}`}
                          className={
                            "absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 flex items-center justify-center w-8 h-8 bg-amber-400 rounded-full cursor-pointer border-2 border-white shadow-sm hover:bg-amber-500 transition-colors"
                          }
                          onClick={() => onClear(group.signature)}
                        >
                          <XIcon size={15} className={"text-white"} />
                        </button>
                      )}
                    </div>
                    {isCompact && (
                      <span className={"text-xs text-secondary text-center"}>
                        {group.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </FieldSet>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
