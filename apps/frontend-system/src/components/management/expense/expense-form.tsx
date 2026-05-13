"use client";

import { useCallback, useEffect, useState } from "react";
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
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Upload,
  Package,
  Banknote,
  CreditCard,
  QrCode,
  Boxes,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useExpenseCategoriesOperation } from "@/hooks/management/expense/use-expense-categories-operations";
import { useMaterialsOperations } from "@/hooks/management/raw-materials/use-materials-operation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ExpenseSchema, ExpenseSchemaInput } from "@repo/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { useImmer } from "use-immer";
import { toIDR } from "../../../../utils/format-money";
import { Label } from "@/components/ui/label";
import { useExpenseOperation } from "@/hooks/management/expense/use-expense-operations";
import { ExpenseFilters } from "@/lib/queries/expense/expense.query";
import { Switch } from "@/components/ui/switch";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExpenseFilters;
}

interface ExpenseItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  price: string;
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
  filters,
}: AddExpenseDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [unitOptions, setUnitOptions] = useImmer(units);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    resetField,
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
  const { dataRawMaterialList } = useMaterialsOperations({
    enabledRawMaterialList: true,
  });
  const { createExpenseData } = useExpenseOperation({ filters });

  const selectedCategory = watch("categoryId");
  const items = watch("expenseItem");
  const [showMaterials, setShowMaterials] = useState(true);

  const isMaterialCategory = dataExpenseCategories?.data?.some(
    (cat) => selectedCategory === cat.id && cat.isMaterialsCategory,
  );

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

  const submitData = (data: ExpenseSchemaInput) => {
    const finalData = {
      ...data,
      totalAmount: calculateTotal(),
    };

    createExpenseData(finalData);
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
              Tambah Pengeluaran Baru
            </DialogTitle>
            <DialogDescription>
              Catat pengeluaran baru dengan semua detail yang relevan.
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
                          <SelectContent>
                            {dataExpenseCategories?.data?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  {cat.name}
                                  {cat.isMaterialsCategory && (
                                    <Package className="h-3 w-3 text-secondary" />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldGroup>

              {/* Materials Section - Only shows for material categories */}
              {isMaterialCategory && (
                <div className="rounded-lg border-2 border-secondary/30 bg-accent/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-secondary" />
                    <h3 className="font-semibold text-secondary">
                      Raw Material Details
                    </h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    This expense will be linked to your inventory. Add the
                    materials purchased below.
                  </p>

                  <div className="space-y-3">
                    {fields.map((item, index) => (
                      <FieldGroup
                        key={item.id}
                        className="grid md:grid-cols-12 gap-2 items-end"
                      >
                        {showMaterials ? (
                          <Controller
                            name={`expenseItem.${index}.rawMaterialId`}
                            control={control}
                            render={({ field }) => (
                              <Field className="md:col-span-4">
                                <FieldLabel className="text-xs">
                                  Material
                                </FieldLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(val) => field.onChange(val)}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select material" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dataRawMaterialList?.data?.map((mat) => (
                                      <SelectItem key={mat.id} value={mat.id}>
                                        {mat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                            )}
                          />
                        ) : (
                          <Controller
                            name={`expenseItem.${index}.itemName`}
                            control={control}
                            render={({ field }) => (
                              <Field className="md:col-span-4">
                                <FieldLabel className="text-xs">
                                  Material
                                </FieldLabel>
                                <Input {...field} placeholder="Nama Item" />
                              </Field>
                            )}
                          />
                        )}

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
                          <Switch
                            checked={showMaterials}
                            onCheckedChange={() => {
                              resetField(`expenseItem.${index}.rawMaterialId`);
                              resetField(`expenseItem.${index}.itemName`);
                              setShowMaterials(!showMaterials);
                            }}
                          />
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
              )}

              {!isMaterialCategory && selectedCategory && (
                <div className="rounded-lg border-2 border-secondary/30 bg-accent/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-secondary" />
                    <h3 className="font-semibold text-secondary">
                      Detail Item
                    </h3>
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
              )}

              {/* Payment Method */}
              <FieldSet>
                <FieldLegend>Payment Method</FieldLegend>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: "cash", label: "Cash", icon: Banknote },
                    { value: "bank", label: "Bank Transfer", icon: CreditCard },
                    { value: "qris", label: "QRIS", icon: QrCode },
                  ].map((method) => (
                    <Button
                      key={method.value}
                      type="button"
                      variant={
                        paymentMethod === method.value ? "default" : "outline"
                      }
                      onClick={() => setPaymentMethod(method.value)}
                      className={cn(
                        "gap-2",
                        paymentMethod === method.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </Button>
                  ))}
                </div>
              </FieldSet>

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

              {/* Receipt Upload */}
              <Field>
                <FieldLabel>Attach Receipt</FieldLabel>
                <Label className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-8 transition-colors hover:border-primary/50 hover:bg-accent/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-card-foreground">
                      Drop files here or click to upload
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                  <Input type="file" className="hidden" />
                </Label>
              </Field>
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
            <Button type="submit">Save Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
