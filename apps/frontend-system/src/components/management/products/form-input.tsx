"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  CreateProductSchemaInput,
  ProductDataById,
  ProductSchema,
  ProductStatusEnum,
  z,
} from "@repo/schemas";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductInfoFields from "./product-info-fields";
import ProductImageFields from "./product-image-fields";
import VariantTypeFields from "./variant-type-fields";
import SimpleProductFields from "./simple-product-fields";
import VariantListFields from "./variant-list-fields";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { useProductImageGroups } from "@/hooks/management/products/use-product-image-groups";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCategoriesOperation } from "@/hooks/management/categories/use-categories-operation";
import { Input } from "@/components/ui/input";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";

const initialData: CreateProductSchemaInput = {
  name: "",
  description: "",
  useVariant: true,
  status: "ACTIVE",
  type: "READY_STOCK",
  categoryId: "",
  variants: [],
  variantsTypes: [],
  productPreOrderDetail: undefined,
};

/** Perkalian kartesian nilai variant. Dipakai untuk kombinasi SKU maupun grup visual. */
function generateCombinations(
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

type ProductById = z.infer<typeof ProductDataById>;
const productById = (data: ProductById | undefined) => {
  if (!data) return undefined;
  return {
    name: data.name,
    description: data.description ?? "",
    useVariant: data.useVariant,
    categoryId: data.categoryId ?? "",
    type: data.type,
    status: data.status,
    variantsTypes:
      data.variantTypes?.map((vt) => ({
        name: vt.name,
        values: vt.values.map((v) => v.value),
        isHaveVisual: vt.isHaveVisual,
      })) ?? [],
    variants:
      data.variants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        cost: Number(v.cost ?? 0),
        options: v.options ?? {},
      })) ?? [],
    productPreOrderDetail: data.productPreOrderDetail
      ? {
          quotaTarget: data.productPreOrderDetail?.quotaTarget,
          maxQuota: data.productPreOrderDetail?.maxQuota,
          endDate: data.productPreOrderDetail?.endDate,
        }
      : undefined,
  };
};

export default function FormProduct({ id }: { id?: string }) {
  const { getCategoriesListData } = useCategoriesOperation({
    enableGetCategoriesList: true,
  });

  const {
    createProductData,
    uploadImageData,
    getProductsDataById,
    updateProductData,
  } = useProductsOperation({ idProduct: id });

  const formValues = productById(getProductsDataById?.data);

  const {
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<CreateProductSchemaInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: initialData,
    values: formValues,
  });

  const useVariant = useWatch({
    control,
    name: "useVariant",
    defaultValue: true,
  });

  const variantTypesData = useWatch({
    control,
    name: "variantsTypes",
  });

  const variantsData = useWatch({
    control,
    name: "variants",
  });

  const typeProduct = useWatch({
    control,
    name: "type",
  });

  const {
    visualGroups,
    groupFiles,
    previewFor,
    setGroupImage,
    clearGroupImage,
  } = useProductImageGroups({
    variantTypes: variantTypesData,
    variants: variantsData,
    useVariant,
    savedGroups: getProductsDataById?.data?.imageGroups,
  });

  const onSubmit = async (values: CreateProductSchemaInput) => {
    // mutateAsync melempar ulang setelah onError menampilkan toast. Ditangkap di
    // sini supaya tidak jadi unhandled rejection dan form tetap terbuka.
    try {
      await saveProduct(values);
    } catch {}
  };

  const saveProduct = async (values: CreateProductSchemaInput) => {
    const result = id
      ? await updateProductData({ id, data: values })
      : await createProductData(values);
    const product = result.data;

    // Petakan lewat signature, bukan urutan indeks variant.
    const idBySignature = new Map(
      product.imageGroups.map((group) => [group.signature, group.id]),
    );

    const imageGroupIds: string[] = [];
    const files: File[] = [];

    for (const [signature, file] of Object.entries(groupFiles)) {
      const imageGroupId = idBySignature.get(signature);
      if (imageGroupId) {
        imageGroupIds.push(imageGroupId);
        files.push(file);
      }
    }

    if (files.length > 0) {
      await uploadImageData({
        productId: String(product.id),
        imageGroupIds,
        files,
      });
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

  /**
   * Mematikan variant menyisakan satu variant kosong sebagai wadah harga dan SKU
   * produk, karena di database produk tanpa variant tetap punya satu
   * ProductVariant implisit. Menyalakannya kembali mengosongkan daftar supaya
   * kombinasi digenerate ulang dari awal.
   */
  const handleUseVariantChange = (checked: boolean) => {
    if (checked) {
      replaceVariants([]);
      return;
    }
    replaceVariants({ sku: "", price: 0, cost: 0, options: {} });
    removeType();
  };

  const handleGenereteCombinations = () => {
    const varTypes = getValues("variantsTypes") ?? [];
    const combinations = generateCombinations(varTypes);
    const currentVariants = getValues("variants") ?? [];

    const isPartialMatch = (
      existingOptions: Record<string, string>,
      newOpts: Record<string, string>,
    ) =>
      Object.keys(existingOptions).every(
        (key) => newOpts[key] === existingOptions[key],
      );

    const claimIds = new Set<string>();
    const newVariant = combinations.map((opts) => {
      // opts SUDAH merupakan record options-nya. Sebelumnya di sini dibandingkan
      // dengan opts.options yang selalu undefined, sehingga variant lama tidak
      // pernah cocok dan SKU yang sudah diedit admin ikut tertimpa.
      const matchData = currentVariants.find(
        (v) => JSON.stringify(v.options) === JSON.stringify(opts),
      );

      if (matchData && !claimIds.has(String(matchData.id))) {
        claimIds.add(String(matchData.id));
        return matchData;
      }

      const partialMatching = currentVariants.find(
        (v) =>
          !claimIds.has(String(v.id)) && isPartialMatch(v.options ?? {}, opts),
      );

      const skuParts = Object.values(opts)
        .map((v) => v.slice(0, 3).toUpperCase())
        .join("-");

      const nameProductPart = getValues("name")
        .split(" ")
        .map((v) => v[0])
        .join("");

      if (partialMatching) {
        claimIds.add(String(partialMatching.id));
        return {
          ...partialMatching,
          sku: `${nameProductPart}-${skuParts}`,
          options: opts,
        };
      }

      return {
        sku: `${nameProductPart}-${skuParts}`,
        price: 0,
        cost: 0,
        options: opts,
      };
    });

    // groupFiles berkunci signature, jadi tidak ada lagi yang perlu dipetakan
    // ulang di sini: file tetap menempel pada grup visualnya.
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
            <ProductInfoFields
              control={control}
              errors={errors}
              categories={getCategoriesListData?.data}
              onUseVariantChange={handleUseVariantChange}
            />

            <ProductImageFields
              groups={visualGroups}
              previewFor={previewFor}
              onPick={setGroupImage}
              onClear={clearGroupImage}
            />

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
                      <VariantTypeFields
                        control={control}
                        types={variantTypesFields}
                        onAppendType={appendType}
                        onRemoveType={removeType}
                        onUpdateType={updateType}
                      />
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
                  <VariantListFields
                    control={control}
                    errors={errors}
                    variants={variantFields}
                    types={variantTypesFields}
                    onRemoveVariant={removeVariant}
                  />
                </CardContent>
              ) : (
                <SimpleProductFields
                  control={control}
                  variants={variantFields}
                />
              )}
            </Card>
          </section>

          {/*Right Side*/}
          <section className={"flex flex-col-reverse lg:flex-col gap-6 "}>
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
                            <SelectContent position="popper">
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
            {typeProduct === "PRE_ORDER" && (
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
                          "font-display data-[variant=legend]:text-lg mb-5"
                        }
                      >
                        Detail Pre-Order
                      </FieldLegend>
                      <Controller
                        control={control}
                        name="productPreOrderDetail.maxQuota"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Kuota maksimal</FieldLabel>
                            <Input
                              value={field.value?.toString()}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                              type={"number"}
                              onWheel={(e) =>
                                (e.target as HTMLInputElement).blur()
                              }
                            />
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name="productPreOrderDetail.quotaTarget"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Target kuota</FieldLabel>
                            <Input
                              value={field.value?.toString()}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                              type={"number"}
                              onWheel={(e) =>
                                (e.target as HTMLInputElement).blur()
                              }
                            />
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name="productPreOrderDetail.endDate"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Tanggal berakhir Pre-Order</FieldLabel>
                            <DatePickerSimple
                              value={field.value as Date}
                              onValueChange={(val) => field.onChange(val)}
                            />
                          </Field>
                        )}
                      />
                    </FieldSet>
                  </FieldGroup>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </form>
    </div>
  );
}
