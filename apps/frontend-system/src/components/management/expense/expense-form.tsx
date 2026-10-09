"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldGroup,
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Plus, Trash2, Boxes, ImagePlus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useExpenseCategoriesOperation } from "@/hooks/management/expense/use-expense-categories-operations";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  EXPENSE_PROOF_MAX_FILES,
  ExpenseSchema,
  ExpenseSchemaInput,
} from "@repo/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { useImmer } from "use-immer";
import { toIDR } from "../../../../utils/format-money";
import { useExpenseOperation } from "@/hooks/management/expense/use-expense-operations";
import {
  compressImage,
  MAX_UPLOAD_BYTES,
} from "../../../../utils/compress-image";
import { toast } from "sonner";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Diisi kalau dialog dibuka untuk mengedit.
   *
   * Satu komponen untuk tambah dan edit, dibedakan oleh prop ini — pola yang
   * sama dengan form Toko dan Kategori. Kalau dipisah jadi dua form, aturan
   * validasinya cepat atau lambat akan menyimpang antara keduanya.
   */
  expenseId?: string | null;
}

const units = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "gram", label: "Gram (g)" },
  { value: "roll", label: "Roll" },
  { value: "meter", label: "Meter (m)" },
  { value: "pcs", label: "Pieces" },
  { value: "bal", label: "Bal" },
];

const initialData: ExpenseSchemaInput = {
  storeId: "",
  categoryId: "",
  description: "",
  totalAmount: 0,
  date: new Date(),
  expenseItem: [
    {
      rawMaterialId: "",
      itemName: "",
      quantity: 0,
      unit: units[0].value,
      price: 0,
      subtotal: 0,
    },
  ],
};

export function AddExpenseDialog({
  open,
  onOpenChange,
  expenseId = null,
}: AddExpenseDialogProps) {
  const [unitOptions, setUnitOptions] = useImmer(units);
  /// Foto yang dipilih sebelum pengeluarannya ada (mode tambah). Baru
  /// diunggah setelah catatannya tersimpan dan punya id.
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const isEditing = !!expenseId;

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<ExpenseSchemaInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: initialData,
  });

  const { fields, remove, append } = useFieldArray({
    control,
    name: "expenseItem",
  });

  const { storeList } = useStoreOperations({ enableStoreList: true });
  const { dataExpenseCategories } = useExpenseCategoriesOperation({});
  const {
    expenseDetailData,
    createExpenseAsync,
    updateExpenseAsync,
    uploadProofsAsync,
    removeProofAsync,
    isUploadingProofs,
    isRemovingProof,
  } = useExpenseOperation({ expenseId: open ? expenseId : null });

  const proofs = expenseDetailData?.proofs ?? [];
  const proofSlotsLeft =
    EXPENSE_PROOF_MAX_FILES - proofs.length - pendingFiles.length;

  /**
   * Form diisi ulang tiap dialog dibuka.
   *
   * Mode edit menunggu detailnya sampai; mode tambah kembali ke keadaan
   * kosong supaya tidak membawa sisa pengeluaran yang barusan dilihat.
   */
  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);

    if (!expenseId) {
      reset(initialData);
      return;
    }

    if (!expenseDetailData) return;

    reset({
      storeId: String(expenseDetailData.storeId),
      categoryId: String(expenseDetailData.categoryId),
      description: expenseDetailData.description ?? "",
      totalAmount: Number(expenseDetailData.totalAmount),
      date: new Date(expenseDetailData.date),
      expenseItem: expenseDetailData.expenseItem.map((item) => ({
        rawMaterialId: "",
        itemName: item.itemName ?? "",
        quantity: item.quantity,
        unit: item.unit,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    });
  }, [open, expenseId, expenseDetailData, reset]);

  /**
   * Foto dikecilkan di browser sebelum diunggah, sama seperti bukti transfer
   * di kasir: foto nota dari HP biasa 3–8 MB, dan rantai browser → backend →
   * Cloudinary untuk berkas sebesar itu kerap lebih lama dari batas waktu.
   */
  const pickFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const chosen = Array.from(fileList);
    if (chosen.length > proofSlotsLeft) {
      toast.error("Jumlah foto melebihi batas", {
        description:
          proofSlotsLeft <= 0
            ? `Bukti sudah ${EXPENSE_PROOF_MAX_FILES} foto (batas maksimal). Hapus salah satu dulu.`
            : `Sisa jatah tinggal ${proofSlotsLeft} foto, sedangkan yang dipilih ${chosen.length}.`,
      });
      return;
    }

    setIsPreparing(true);
    try {
      const prepared: File[] = [];
      for (const file of chosen) {
        const compressed = await compressImage(file);
        if (compressed.size > MAX_UPLOAD_BYTES) {
          toast.error(`Foto ${file.name} terlalu besar`, {
            description: "Maksimal 2MB setelah dikecilkan. Coba foto lain.",
          });
          continue;
        }
        prepared.push(compressed);
      }

      if (prepared.length === 0) return;

      // Pada pengeluaran yang sudah ada, foto langsung diunggah supaya admin
      // tidak perlu menekan Simpan hanya untuk melampirkan bukti.
      if (expenseId) {
        await uploadProofsAsync({ id: expenseId, files: prepared });
      } else {
        setPendingFiles((current) => [...current, ...prepared]);
      }
    } finally {
      setIsPreparing(false);
    }
  };

  const items = watch("expenseItem");

  const addItem = () => {
    append({
      rawMaterialId: "",
      itemName: "",
      quantity: 0,
      unit: "",
      price: 0,
      subtotal: 0,
    });
  };

  const calculateTotal = () => {
    return items?.reduce((total, item) => {
      const qty = item.quantity || 0;
      const price = item.price || 0;
      return total + qty * price;
    }, 0);
  };

  const submitData = async (data: ExpenseSchemaInput) => {
    const finalData = {
      ...data,
      totalAmount: calculateTotal(),
    };

    try {
      if (expenseId) {
        await updateExpenseAsync({ id: expenseId, data: finalData });
      } else {
        const created = await createExpenseAsync(finalData);

        // Foto yang dipilih sebelum catatannya ada baru bisa diunggah
        // sekarang, karena unggahan butuh id pengeluaran.
        if (pendingFiles.length > 0) {
          await uploadProofsAsync({
            id: String(created.data.id),
            files: pendingFiles,
          });
        }
      }

      onOpenChange(false);
    } catch {
      // Toast galatnya sudah ditampilkan mutation. Dialog sengaja dibiarkan
      // terbuka supaya isian admin tidak hilang.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl bg-card overflow-hidden flex flex-col p-0">
        <form
          onSubmit={handleSubmit(submitData, (error) => console.log(error))}
          className="flex flex-1 flex-col overflow-hidden p-4"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Ubah detail pengeluaran. Nominalnya ikut memperbarui catatan kas."
                : "Catat pengeluaran baru dengan semua detail yang relevan."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="overflow-y-auto no-scrollbar">
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <FieldGroup>
                <Controller
                  name="storeId"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Store</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {storeList?.data?.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.storeId && (
                        <FieldError>{errors.storeId.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Date</FieldLabel>
                        <DatePickerSimple
                          value={field.value as Date}
                          onValueChange={(val) => field.onChange(val)}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Category</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val);
                          }}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {dataExpenseCategories?.data?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.categoryId && (
                          <FieldError>{errors.categoryId.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldGroup>

              <div className="rounded-lg border-2 border-secondary/30 bg-accent/50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-secondary" />
                  <h3 className="font-semibold text-secondary">Detail Item</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Catat item dari pengeluaran anda di sini. Item di sini tidak
                  terhubung dengan bahan baku
                </p>

                <div className="space-y-3">
                  {fields.map((item, index) => (
                    <FieldGroup
                      key={item.id}
                      className="grid grid-cols-6 md:grid-cols-12 gap-2 items-end"
                    >
                      <Controller
                        name={`expenseItem.${index}.itemName`}
                        control={control}
                        render={({ field }) => (
                          <Field className="md:col-span-4">
                            <FieldLabel className="text-xs">Item</FieldLabel>
                            <Input
                              className="bg-background"
                              placeholder="Nama Item"
                              {...field}
                            />
                          </Field>
                        )}
                      />

                      <Controller
                        name={`expenseItem.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <Field className="md:col-span-1">
                            <FieldLabel className="text-xs">
                              Quantity
                            </FieldLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.value}
                              onChange={(e) => {
                                const qty = Number(e.target.value);
                                field.onChange(qty);

                                const price = getValues(
                                  `expenseItem.${index}.price`,
                                );
                                setValue(
                                  `expenseItem.${index}.subtotal`,
                                  qty * price,
                                );
                              }}
                              className="bg-background"
                            />
                          </Field>
                        )}
                      />

                      <Controller
                        name={`expenseItem.${index}.unit`}
                        control={control}
                        render={({ field }) => (
                          <Field className="md:col-span-2">
                            <FieldLabel className="text-xs">Unit</FieldLabel>
                            <CreatableCombobox
                              options={unitOptions}
                              value={field.value}
                              onChange={(val) => field.onChange(val)}
                              onCreate={async (input) => {
                                const newUnit = {
                                  value: input.toLowerCase(),
                                  label: input,
                                };
                                setUnitOptions((draft) => {
                                  draft.push(newUnit);
                                });
                                return newUnit;
                              }}
                            />
                          </Field>
                        )}
                      />

                      <Controller
                        name={`expenseItem.${index}.price`}
                        control={control}
                        render={({ field }) => (
                          <Field className="md:col-span-2">
                            <FieldLabel className="text-xs">
                              Harga per Unit
                            </FieldLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.value}
                              onChange={(e) => {
                                const price = Number(e.target.value);
                                field.onChange(price);

                                const qty = getValues(
                                  `expenseItem.${index}.quantity`,
                                );
                                setValue(
                                  `expenseItem.${index}.subtotal`,
                                  qty * price,
                                );
                              }}
                              className="bg-background"
                            />
                          </Field>
                        )}
                      />

                      <Controller
                        name={`expenseItem.${index}.subtotal`}
                        control={control}
                        render={({ field }) => (
                          <Field className="md:col-span-2">
                            <FieldLabel className="text-xs">
                              Sub Total
                            </FieldLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              value={Number(field.value)}
                              readOnly
                              className="bg-background"
                            />
                          </Field>
                        )}
                      />

                      <Field className="col-span-1">
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Field>
                    </FieldGroup>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {/* Total */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="font-mono text-lg font-semibold text-card-foreground">
                    {toIDR(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Bukti pengeluaran */}
              <Field>
                <FieldLabel>
                  Bukti Pengeluaran (opsional, maksimal{" "}
                  {EXPENSE_PROOF_MAX_FILES} foto)
                </FieldLabel>

                {(proofs.length > 0 || pendingFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                      >
                        <a
                          href={proof.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka foto ukuran penuh"
                        >
                          <Image
                            src={proof.image}
                            alt="Bukti pengeluaran"
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            expenseId &&
                            removeProofAsync({
                              id: expenseId,
                              proofId: proof.id,
                            }).catch(() => {})
                          }
                          disabled={isRemovingProof}
                          aria-label="Hapus bukti"
                          className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Mode tambah: foto belum terunggah, jadi ditandai
                        "menunggu" supaya jelas bedanya dengan yang tersimpan. */}
                    {pendingFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border p-1 text-center"
                      >
                        <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          menunggu
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingFiles((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                          aria-label="Batalkan foto ini"
                          className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={
                      isPreparing || isUploadingProofs || proofSlotsLeft <= 0
                    }
                    onClick={() =>
                      document.getElementById("expense-proof-input")?.click()
                    }
                  >
                    <ImagePlus className="h-4 w-4" />
                    {isPreparing
                      ? "Menyiapkan gambar..."
                      : isUploadingProofs
                        ? "Mengunggah..."
                        : "Tambah Foto"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {proofSlotsLeft > 0
                      ? `Sisa ${proofSlotsLeft} foto. Nota atau struk, maksimal 2MB per foto.`
                      : "Batas foto sudah tercapai."}
                  </p>
                </div>

                <input
                  id="expense-proof-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(event) => {
                    void pickFiles(event.target.files);
                    // Dikosongkan supaya memilih berkas yang sama dua kali
                    // tetap memicu onChange.
                    event.target.value = "";
                  }}
                />
              </Field>

              {/* Notes */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Notes (Optional)</FieldLabel>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="min-h-20 bg-background"
                      {...field}
                    />
                  </Field>
                )}
              />
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Simpan Perubahan" : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
