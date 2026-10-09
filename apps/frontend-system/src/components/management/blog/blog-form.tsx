"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BLOG_KEYWORD_MAX,
  BlogDetailDataType,
  BlogSchema,
  BlogSchemaInput,
} from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useBlogOperation } from "@/hooks/management/blog/use-blog-operation";
import { toSlug } from "@/lib/utils";
import {
  compressImage,
  MAX_UPLOAD_BYTES,
} from "../../../../utils/compress-image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface BlogFormProps {
  /// Diisi saat dipakai untuk mengubah tulisan yang sudah ada.
  initialData?: BlogDetailDataType | null;
}

const emptyValues: BlogSchemaInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: null,
  keywords: [],
  status: "DRAFT",
  categoryId: null,
};

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [keywordDraft, setKeywordDraft] = useState("");
  const [isPreparingCover, setIsPreparingCover] = useState(false);

  const {
    blogCategories,
    createBlogData,
    updateBlogData,
    isCreateBlogData,
    isUpdateBlogData,
    uploadCoverAsync,
    isUploadingCover,
  } = useBlogOperation({ enableCategories: true });

  const { control, handleSubmit, setValue, getValues, watch } =
    useForm<BlogSchemaInput>({
      resolver: zodResolver(BlogSchema),
      defaultValues: initialData
        ? {
            title: initialData.title,
            slug: initialData.slug,
            excerpt: initialData.excerpt ?? "",
            content: initialData.content,
            coverImage: initialData.coverImage,
            keywords: initialData.keywords,
            status: initialData.status,
            categoryId: initialData.categoryId,
          }
        : emptyValues,
    });

  const coverImage = watch("coverImage");
  const keywords = watch("keywords") ?? [];
  const isSaving = isCreateBlogData || isUpdateBlogData;

  /**
   * Menyiapkan gambar sebelum diunggah: dikecilkan dulu di browser supaya
   * foto 5 MB dari HP tidak menempuh unggahan panjang lalu ditolak server.
   */
  const prepareAndUpload = async (file: File) => {
    setIsPreparingCover(true);
    try {
      const compressed = await compressImage(file);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        toast.error("Gambar terlalu besar", {
          description: "Maksimal 2MB setelah dikecilkan. Coba gambar lain.",
        });
        return undefined;
      }
      return await uploadCoverAsync(compressed);
    } catch {
      /// Pesan galatnya sudah ditampilkan mutation.
      return undefined;
    } finally {
      setIsPreparingCover(false);
    }
  };

  const addKeyword = () => {
    const value = keywordDraft.trim();
    if (!value) return;

    const current = getValues("keywords") ?? [];
    if (current.length >= BLOG_KEYWORD_MAX) {
      toast.error(`Maksimal ${BLOG_KEYWORD_MAX} kata kunci`);
      return;
    }
    if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setKeywordDraft("");
      return;
    }

    setValue("keywords", [...current, value], { shouldDirty: true });
    setKeywordDraft("");
  };

  const submit = async (data: BlogSchemaInput) => {
    try {
      if (initialData) {
        await updateBlogData({ id: initialData.id, data });
      } else {
        await createBlogData(data);
      }
      router.push("/management/blog");
    } catch {
      // Halaman dibiarkan terbuka supaya tulisan yang sudah diketik tidak
      // hilang saat penyimpanan ditolak (mis. slug bentrok).
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Kolom kiri: isi tulisan */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Judul</FieldLabel>
                <Input
                  placeholder="Cara merawat rajutan agar awet"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    /// Slug hanya ikut judul selama tulisan belum pernah
                    /// tersimpan. Tulisan yang sudah terbit URL-nya bisa
                    /// tersebar, jadi tidak diubah diam-diam saat judulnya
                    /// disunting.
                    if (!initialData) {
                      setValue("slug", toSlug(event.target.value), {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input placeholder="cara-merawat-rajutan" {...field} />
                <FieldDescription>
                  Alamat tulisan: /blog/{field.value || "slug-tulisan"}
                </FieldDescription>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="content"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Isi tulisan</FieldLabel>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSaving}
                  onUploadImage={prepareAndUpload}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="excerpt"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Ringkasan</FieldLabel>
                <Textarea
                  className="h-20"
                  placeholder="Boleh dikosongkan — akan diambil otomatis dari awal tulisan."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
                <FieldDescription>
                  Dipakai di daftar blog dan sebagai deskripsi di hasil
                  pencarian.
                </FieldDescription>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />
        </div>

        {/* Kolom kanan: penerbitan dan metadata */}
        <div className="space-y-4">
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="DRAFT">Draf</SelectItem>
                      <SelectItem value="PUBLISHED">Terbit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Draf hanya terlihat di sini, tidak muncul di halaman blog.
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Kategori</FieldLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tanpa kategori" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="none">Tanpa kategori</SelectItem>
                      {blogCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <FieldLabel>Gambar sampul</FieldLabel>
            {coverImage ? (
              <div className="relative aspect-video overflow-hidden rounded-md border">
                <Image
                  src={coverImage}
                  alt="Sampul tulisan"
                  fill
                  sizes="320px"
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 size-7"
                  aria-label="Hapus sampul"
                  onClick={() =>
                    setValue("coverImage", null, { shouldDirty: true })
                  }
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent/40">
                {isPreparingCover || isUploadingCover ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImagePlus className="size-5" />
                )}
                <span>Pilih gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    const url = await prepareAndUpload(file);
                    if (url) setValue("coverImage", url, { shouldDirty: true });
                  }}
                />
              </label>
            )}
            <FieldDescription>
              Dipakai di daftar blog dan saat tautannya dibagikan ke WhatsApp
              atau media sosial.
            </FieldDescription>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Field>
              <FieldLabel>Tag</FieldLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="rajut, perawatan"
                  value={keywordDraft}
                  onChange={(event) => setKeywordDraft(event.target.value)}
                  onKeyDown={(event) => {
                    /// Enter di sini menambah kata kunci, bukan mengirim
                    /// seluruh form — tulisan panjang tidak boleh ikut
                    /// tersimpan gara-gara satu ketukan Enter.
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Tambah
                </Button>
              </div>
              <FieldDescription>
                Maksimal {BLOG_KEYWORD_MAX} tag. Pembaca bisa mengeklik tag di
                artikel untuk melihat tulisan lain bertag sama.
              </FieldDescription>
            </Field>

            <div className="flex flex-wrap gap-2">
              {keywords.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada tag.</p>
              )}
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <button
                    type="button"
                    aria-label={`Hapus tag ${keyword}`}
                    onClick={() =>
                      setValue(
                        "keywords",
                        keywords.filter((item) => item !== keyword),
                        { shouldDirty: true },
                      )
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/management/blog")}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
