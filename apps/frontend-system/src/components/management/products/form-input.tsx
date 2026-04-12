"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription, FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Trash2, UploadIcon, XIcon } from "lucide-react";
import UploadImage from "@/assets/upload-image.png";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  CreateProductSchemaInput,
  ProductSchema,
  ProductStatusEnum,
  UpdateProductSchema,
  UpdateProductSchemaInput,
} from "@repo/schemas";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { zodResolver } from "@hookform/resolvers/zod";

const initialData: CreateProductSchemaInput = {
  name: "",
  description: "",
  useVariant: true,
  status: "ACTIVE",
  variants: [],
  variantsTypes: [],
};

function generateCombinationSku(
  types: { name: string; values: string[] }[],
): Record<string, string>[] {
  if (!types || types.length === 0) return [];

  const validTypes = types.filter(
    (t) => t.name && t.values.some((v) => v.trim() !== ""),
  );
  if (validTypes.length === 0) return [];

  const result: Record<string, string>[] = [{}];
  for (const type of validTypes) {
    const validValue = type.values.filter((v) => v.trim() !== "");
    if (validValue.length === 0) continue;
    const newResult: Record<string, string>[] = [];
    for (const existing of result) {
      for (const val of validValue) {
        newResult.push({ ...existing, [type.name]: val });
      }
    }
    if (newResult.length > 0) result.splice(0, result.length, ...newResult);
  }

  return result.filter((r) => Object.keys(r).length > 0);
}

export default function FormProduct({ id }: { id?: string }) {
  const {
    createProductData,
    uploadImageData,
    getProductsDataById,
    updateProductData,
  } = useProductsOperation({ idProduct: id });

  const formValues = useMemo(() => {
    const data = getProductsDataById?.data;
    if (!data) return undefined;
    return {
      name: data.name,
      description: data.description ?? "",
      useVariant: data.useVariant,
      status: data.status,
      variantsTypes:
        data.variantTypes?.map((vt) => ({
          name: vt.name,
          values: vt.values.map((v) => v.value),
        })) ?? [],
      variants:
        data.variants?.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          cost: Number(v.cost ?? 0),
          image: v.image ?? "",
          options: (v as any).options ?? {},
        })) ?? [],
    };
  }, [getProductsDataById]);

  const {
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateProductSchemaInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: initialData,
    values: formValues,
  });

  const [variantFiles, setVariantFiles] = useState<(File | null)[]>([]);

  const onSubmit = async (values: CreateProductSchemaInput) => {
    if (id) {
      const result = await updateProductData({ id, data: values });
      const product = result.data;

      const variantIdsWithFile: string[] = [];
      const filesToUpload: File[] = [];

      variantFiles.forEach((file, i) => {
        const imageValue = values.variants?.[i]?.image;
        const isBlobUrl = imageValue?.startsWith("blob:");

        if (file && isBlobUrl && product.variants[i]) {
          variantIdsWithFile.push(String(product.variants[i].id));
          filesToUpload.push(file);
        }
      });

      if (filesToUpload.length > 0) {
        uploadImageData({
          productId: String(product.id),
          variantIds: variantIdsWithFile,
          files: filesToUpload,
        });
      }
    } else {
      const result = await createProductData(
        values as CreateProductSchemaInput,
      );
      const product = result.data;

      const variantIdsWithFile: string[] = [];
      const filesToUpload: File[] = [];

      variantFiles.forEach((file, i) => {
        if (file && product.variants[i]) {
          variantIdsWithFile.push(String(product.variants[i].id));
          filesToUpload.push(file);
        }
      });

      if (filesToUpload.length > 0) {
        await uploadImageData({
          productId: String(product.id),
          variantIds: variantIdsWithFile,
          files: filesToUpload,
        });
      }
    }
  };

  const {
    fields: variantFields,
    replace: replaceVariants,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: variantTypesFields,
    append: appendType,
    remove: removeType,
    update: updateType,
  } = useFieldArray({
    control,
    name: "variantsTypes",
  });

  const [typeInput, setTypeInput] = useState("");
  const [valueInputs, setvalueInputs] = useState<Record<number, string>>({});

  const useVariant = useWatch({
    control,
    name: "useVariant",
    defaultValue: true,
  });

  const variantsData = useWatch({
    control,
    name: "variants",
  });

  const addVariantType = (typeInputValue: string) => {
    if (!typeInputValue.trim()) return;
    appendType({ name: typeInputValue.trim(), values: [] });
    setTypeInput("");
  };

  const handleGenereteCombinations = () => {
    const varTypes = getValues("variantsTypes") ?? [];
    const combinations = generateCombinationSku(varTypes);
    const currentVariants = getValues('variants') ?? []

    const isPartialMatch = (
      existingOptions: Record<string, string>,
      newOpts: Record<string, string>,
    ) => Object.keys(existingOptions).every((key) => newOpts[key] === existingOptions[key]);

    const newVariant = combinations.map((opts) => {
      const matchData = currentVariants.find(
        (v) => JSON.stringify(v.options) === JSON.stringify(opts.options)
      )
      if (matchData) return matchData

      const partialMatching = currentVariants.find(
        (v) => isPartialMatch(v.options ?? {}, opts)
      )
      if (partialMatching) return {...partialMatching, options: opts}

      const skuParts = Object.values(opts)
        .map((v) => v.slice(0, 3).toUpperCase())
        .join("-");
      return { sku: skuParts, price: 0, cost: 0, options: opts };
    });

    const newVariantsFiles = newVariant.map((v) => {
      const oldIndex = currentVariants.findIndex(
        (cv) => JSON.stringify(cv.options) === JSON.stringify(v.options)
      )
      return oldIndex !== -1 ? (variantFiles[oldIndex] ?? null) : null;
    })
    setVariantFiles(newVariantsFiles);
    return replaceVariants(newVariant);
  };

  return (
    <div className={"flex flex-1 flex-col gap-4 p-4 mb-20"}>
      <div className={"flex items-center gap-3 my-3"}>
        <Button variant={"ghost"}>
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className={"text-2xl font-light font-display"}>
            Tambah Product Baru
          </h1>
          <p className={"text-secondary text-sm"}>
            Formulir untuk mengisi data dari product baru. Silahkan isi formulir
            berikut dengan data yang benar
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit, (errors) =>
          console.log("Validation errors:", errors),
        )}
      >
        <div className={"grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6"}>
          {/*Left Side*/}
          <section className={"space-y-6"}>
            <Card className={"shadow-sm bg-primary-foreground space-y-5"}>
              <CardContent className={"py-2 px-5"}>
                <FieldGroup>
                  <FieldSet>
                    <FieldLegend
                      className={"font-display data-[variant=legend]:text-xl"}
                    >
                      Informasi Product
                    </FieldLegend>
                    <FieldDescription>
                      Pastikan tidak ada nama produk yang sama saat menambahkan
                      produk atau mengedit produk
                    </FieldDescription>
                    <FieldGroup>
                      <Controller
                        control={control}
                        name={"name"}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className={"text-sm text-secondary"}>
                              NAMA PRODUCT
                            </FieldLabel>
                            <Input
                              placeholder={"e.g. Syal Katun Lembut"}
                              {...field}
                            />
                            <FieldError>{errors.name?.message}</FieldError>
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"description"}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className={"text-sm text-secondary"}>
                              DESKRIPSI
                            </FieldLabel>
                            <Textarea
                              className={"min-h-30"}
                              placeholder={
                                "Tambahkan deskripsi dari product ini"
                              }
                              {...field}
                            />
                            <FieldError>{errors.description?.message}</FieldError>
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"useVariant"}
                        render={({ field }) => (
                          <Field orientation={"horizontal"}>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) {
                                  replaceVariants({
                                    sku: "",
                                    price: 0,
                                    cost: 0,
                                    image: "",
                                    options: {},
                                  });
                                  setVariantFiles([null]);
                                  removeType();
                                } else {
                                  replaceVariants([]);
                                }
                              }}
                            />
                            <FieldLabel>Menggunakan Variant</FieldLabel>
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </FieldSet>
                </FieldGroup>
              </CardContent>
            </Card>
            <Card className={"shadow-sm bg-primary-foreground space-y-5"}>
              {useVariant ? (
                <CardContent className={"py-2 px-5"}>
                  <FieldGroup>
                    <FieldSet>
                      <FieldLegend
                        className={"font-display data-[variant=legend]:text-xl"}
                      >
                        Informasi Variant
                      </FieldLegend>
                      <FieldDescription className={"text-sm text-secondary"}>
                        Saat anda menggunakan variant, maka minimal harus ada 1
                        variant yang di buat
                      </FieldDescription>
                      <FieldGroup>
                        <Controller
                          name={"variantsTypes"}
                          control={control}
                          render={({ field }) => (
                            <Field orientation={"horizontal"}>
                              <Input
                                value={typeInput}
                                onChange={(e) => setTypeInput(e.target.value)}
                                placeholder={"e.g. Warna, Ukuran"}
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  (e.preventDefault(),
                                  addVariantType(typeInput))
                                }
                              />
                              <Button
                                type={"button"}
                                onClick={() => addVariantType(typeInput)}
                              >
                                Tambah Tipe Variant
                              </Button>
                            </Field>
                          )}
                        />
                        {variantTypesFields.map((f, i) => (
                          <Card key={f.id}>
                            <CardContent>
                              <div
                                className={"flex justify-between items-center"}
                              >
                                <span className={"font-semibold"}>
                                  {f.name}
                                </span>
                                <Button
                                  variant={"destructive"}
                                  type={"button"}
                                  onClick={() => removeType(i)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                              <div className={"flex flex-wrap gap-3 my-3"}>
                                {f.values.map((val, vi) => (
                                  <Badge key={vi}>
                                    {val}
                                    <Button
                                      type={"button"}
                                      size={"xs"}
                                      className={"hover:text-destructive"}
                                      onClick={() => {
                                        const newValues = f.values.filter(
                                          (_, idx) => idx !== vi,
                                        );
                                        updateType(i, {
                                          ...f,
                                          values: newValues,
                                        });
                                      }}
                                    >
                                      <XIcon />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              <FieldGroup>
                                <Field orientation={"horizontal"}>
                                  <Input
                                    placeholder={"e.g. Merah, Katun"}
                                    value={valueInputs[i] ?? ""}
                                    onChange={(e) =>
                                      setvalueInputs((prev) => ({
                                        ...prev,
                                        [i]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        const val = valueInputs[i]?.trim();
                                        if (!val) return;
                                        updateType(i, {
                                          ...f,
                                          values: [...f.values, val],
                                        });
                                        setvalueInputs((prev) => ({
                                          ...prev,
                                          [i]: "",
                                        }));
                                      }
                                    }}
                                  />
                                  <Button type={"button"}>
                                    Tambah Variant
                                  </Button>
                                </Field>
                              </FieldGroup>
                            </CardContent>
                          </Card>
                        ))}
                      </FieldGroup>
                    </FieldSet>
                  </FieldGroup>
                  {variantTypesFields.some((vt) => vt.values.length > 0) && (
                    <Button
                      className={"my-8"}
                      type={"button"}
                      onClick={handleGenereteCombinations}
                    >
                      Generate Combinations
                    </Button>
                  )}
                  {variantFields.length >= 1 && (
                    <div>
                      {variantFields.map((vf, iv) => {
                        const photoPreview = variantsData?.[iv]?.image;

                        return (
                          <Card key={vf.id} className={"mb-5"}>
                            <CardHeader>
                              <CardTitle className={"flex justify-between"}>
                                <div className={"flex gap-3"}>
                                  {variantTypesFields.map((vt) => (
                                    <Badge key={vt.id}>
                                      {vt.name}: {vf.options[vt.name]}
                                    </Badge>
                                  ))}
                                </div>
                                <Button
                                  variant={"destructive"}
                                  type={"button"}
                                  onClick={() => removeVariant(iv)}
                                >
                                  <Trash2 />
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <FieldGroup
                                className={"lg:flex-row items-center"}
                              >
                                <Controller
                                  name={`variants.${iv}.image`}
                                  control={control}
                                  render={({ field }) => (
                                    <div className={"relative"}>
                                      <div
                                        className={
                                          "h-20 w-20 border border-dashed rounded-md flex justify-center items-center"
                                        }
                                      >
                                        <Label
                                          className={
                                            "hover:bg-black/10 w-20 h-20 rounded-md absolute"
                                          }
                                        >
                                          <Input
                                            {...field}
                                            value={""}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const url =
                                                URL.createObjectURL(file);
                                              setValue(
                                                `variants.${iv}.image`,
                                                url,
                                              );
                                              setVariantFiles((prev) => {
                                                const newFiles = [...prev];
                                                newFiles[iv] = file ?? "";
                                                return newFiles;
                                              });
                                            }}
                                            type={"file"}
                                            className={"hidden"}
                                          />
                                        </Label>
                                        {photoPreview ? (
                                          <img
                                            className={
                                              "h-20 w-20 object-cover rounded-md"
                                            }
                                            src={photoPreview!}
                                            alt={"Product Image"}
                                          />
                                        ) : (
                                          <Image
                                            className={
                                              "h-10 w-10 object-cover rounded-md"
                                            }
                                            src={UploadImage}
                                            alt={"Product Image"}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                />
                                <Controller
                                  name={`variants.${iv}.sku`}
                                  control={control}
                                  render={({ field }) => (
                                    <Field>
                                      <FieldLabel>SKU</FieldLabel>
                                      <Input {...field} />
                                      <FieldError>{errors.variants?.[iv]?.sku?.message}</FieldError>
                                    </Field>
                                  )}
                                />
                                <Controller
                                  name={`variants.${iv}.price`}
                                  control={control}
                                  render={({ field }) => (
                                    <Field>
                                      <FieldLabel>Harga</FieldLabel>
                                      <Input
                                        type={"number"}
                                        value={field.value}
                                        onWheel={(e) =>
                                          (e.target as HTMLInputElement).blur()
                                        }
                                        onChange={(e) => {
                                          field.onChange(
                                            e.target.value === ""
                                              ? 0
                                              : Number(e.target.value),
                                          );
                                        }}
                                      />
                                    </Field>
                                  )}
                                />
                                <Controller
                                  name={`variants.${iv}.cost`}
                                  control={control}
                                  render={({ field }) => (
                                    <Field>
                                      <FieldLabel>Biaya Modal</FieldLabel>
                                      <Input
                                        type={"number"}
                                        value={field.value}
                                        onWheel={(e) =>
                                          (e.target as HTMLInputElement).blur()
                                        }
                                        onChange={(e) => {
                                          field.onChange(
                                            e.target.value === ""
                                              ? 0
                                              : Number(e.target.value),
                                          );
                                        }}
                                      />
                                    </Field>
                                  )}
                                />
                              </FieldGroup>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent className={"py-2 px-5"}>
                  <FieldGroup>
                    <FieldSet>
                      <FieldLegend>Detail Product</FieldLegend>
                      <FieldDescription>
                        Lengkapi detail product anda di bawah ini
                      </FieldDescription>
                      {variantFields.map((f, i) => {
                        const photoPreview = variantsData?.[i]?.image;
                        return (
                          <div
                            key={f.id}
                            className={
                              "flex justify-between items-center px-8 mb-5"
                            }
                          >
                            <div className={"relative"}>
                              {photoPreview ? (
                                <img
                                  src={photoPreview!}
                                  className={
                                    "w-50 h-50 object-cover rounded-md border"
                                  }
                                  alt="Image Product"
                                />
                              ) : (
                                <div
                                  className={
                                    "bg-accent w-50 h-50 p-10 rounded-md border"
                                  }
                                >
                                  <Image
                                    src={UploadImage}
                                    alt={"Upload Image"}
                                    className={"object-center"}
                                  />
                                </div>
                              )}
                              {photoPreview ? (
                                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                                  {/* Gunakan label agar area klik lebih mudah diatur, lalu sembunyikan input aslinya */}
                                  <button
                                    className="w-8 h-8 bg-amber-400 rounded-full cursor-pointer border-2 border-white shadow-sm hover:bg-amber-500 transition-colors "
                                    onClick={() => {
                                      // setPhotoFile(null);
                                      setValue(`variants.${i}.image`, "");
                                    }}
                                  >
                                    x
                                  </button>
                                </div>
                              ) : (
                                <Controller
                                  name={`variants.${i}.image`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                                      {/* Gunakan label agar area klik lebih mudah diatur, lalu sembunyikan input aslinya */}
                                      <label className="flex items-center justify-center w-8 h-8 bg-amber-400 rounded-full cursor-pointer border-2 border-white shadow-sm hover:bg-amber-500 transition-colors">
                                        <Input
                                          type="file"
                                          className="hidden" // Sembunyikan input asli yang kaku
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const url =
                                              URL.createObjectURL(file);
                                            setValue(
                                              `variants.${i}.image`,
                                              url,
                                            );

                                            setVariantFiles((prev) => {
                                              const newFiles = [...prev];
                                              newFiles[i] = file ?? "";
                                              return newFiles;
                                            });
                                            // setPhotoFile(file);
                                          }}
                                        />
                                        <span>
                                          <UploadIcon
                                            size={15}
                                            className={"text-white"}
                                          />
                                        </span>
                                      </label>
                                    </div>
                                  )}
                                />
                              )}
                            </div>
                            <div className={"flex flex-col gap-3 w-3/5"}>
                              <div className={"flex gap-3"}>
                                <Controller
                                  control={control}
                                  name={`variants.${i}.price`}
                                  render={({ field, fieldState }) => (
                                    <Field>
                                      <FieldLabel>Harga</FieldLabel>
                                      <Input
                                        type={"number"}
                                        onWheel={(e) =>
                                          (e.target as HTMLInputElement).blur()
                                        }
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(
                                            e.target.value === ""
                                              ? 0
                                              : Number(e.target.value),
                                          );
                                        }}
                                      />
                                    </Field>
                                  )}
                                />
                                <Controller
                                  control={control}
                                  name={`variants.${i}.cost`}
                                  render={({ field, fieldState }) => (
                                    <Field>
                                      <FieldLabel>Biaya Modal</FieldLabel>
                                      <Input
                                        type={"number"}
                                        {...field}
                                        onWheel={(e) =>
                                          (e.target as HTMLInputElement).blur()
                                        }
                                        onChange={(e) => {
                                          field.onChange(
                                            e.target.value === ""
                                              ? 0
                                              : Number(e.target.value),
                                          );
                                        }}
                                      />
                                    </Field>
                                  )}
                                />
                              </div>
                              <Controller
                                control={control}
                                name={`variants.${i}.sku`}
                                render={({ field, fieldState }) => (
                                  <Field>
                                    <FieldLabel>SKU</FieldLabel>
                                    <Input {...field} />
                                  </Field>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </FieldSet>
                  </FieldGroup>
                </CardContent>
              )}
            </Card>
          </section>

          {/*Right Side*/}
          <section className={"space-y-6"}>
            <Card
              className={
                "shadow-sm bg-primary-foreground space-y-4 lg:sticky lg:top-10"
              }
            >
              <CardContent className={"py-2 px-5"}>
                <FieldGroup>
                  <FieldSet>
                    <FieldLegend
                      className={
                        "font-display data-[variant=legend]:text-xl mb-5"
                      }
                    >
                      Publish
                    </FieldLegend>
                    <Field>
                      <FieldLabel className={"text-sm text-secondary"}>
                        STATUS
                      </FieldLabel>
                      <Controller
                        name={"status"}
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger size={"lg"} className={"text-base"}>
                              <SelectValue
                                placeholder={"Pilih status Produk"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem
                                  value={ProductStatusEnum.enum["ACTIVE"]}
                                >
                                  Active
                                </SelectItem>
                                <SelectItem
                                  value={ProductStatusEnum.enum["NONACTIVE"]}
                                >
                                  Non Active
                                </SelectItem>
                                <SelectItem
                                  value={ProductStatusEnum.enum["DRAFT"]}
                                >
                                  Draft
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <div className={"flex flex-wrap gap-3"}>
                        <Button type={"submit"}>Buat Produk</Button>
                        <Button type={"button"} variant={"outline"}>
                          Batal
                        </Button>
                      </div>
                    </Field>
                  </FieldSet>
                </FieldGroup>
              </CardContent>
            </Card>
          </section>
        </div>
      </form>
    </div>
  );
}
