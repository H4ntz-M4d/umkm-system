"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Upload,
  Package,
  Banknote,
  CreditCard,
  QrCode,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExpenseItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  price: string;
}

const categories = [
  { value: "raw-material", label: "Raw Material", isMaterial: true },
  { value: "utility", label: "Utility", isMaterial: false },
  { value: "salary", label: "Salary", isMaterial: false },
  { value: "marketing", label: "Marketing", isMaterial: false },
  { value: "equipment", label: "Equipment", isMaterial: true },
  { value: "logistics", label: "Logistics", isMaterial: false },
];

const stores = [
  { value: "store1", label: "Store 1" },
  { value: "store2", label: "Store 2" },
  { value: "production", label: "Production House" },
];

const materials = [
  { value: "wool-merino", label: "Wool Yarn - Premium Merino" },
  { value: "cotton-organic", label: "Cotton Thread - Organic" },
  { value: "bamboo-fiber", label: "Bamboo Fiber" },
  { value: "alpaca-blend", label: "Alpaca Blend" },
  { value: "silk-thread", label: "Silk Thread" },
];

const units = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "gram", label: "Gram (g)" },
  { value: "roll", label: "Roll" },
  { value: "meter", label: "Meter (m)" },
  { value: "pcs", label: "Pieces" },
  { value: "bal", label: "Bal" },
];

export function AddExpenseDialog({
  open,
  onOpenChange,
}: AddExpenseDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: "1", name: "", quantity: "", unit: "kg", price: "" },
  ]);

  const selectedCategory = categories.find((c) => c.value === category);
  const isMaterialCategory = selectedCategory?.isMaterial || false;

  const addItem = () => {
    setItems([
      ...items,
      { id: String(Date.now()), name: "", quantity: "", unit: "kg", price: "" },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return total + qty * price;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl bg-card overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Tambah Pengeluaran Baru</DialogTitle>
          <DialogDescription>
            Catat pengeluaran baru dengan semua detail yang relevan.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="overflow-y-auto no-scrollbar">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <FieldGroup>
              <Field>
                <FieldLabel>Store</FieldLabel>
                <Select>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.value} value={store.value}>
                        {store.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            {cat.label}
                            {cat.isMaterial && (
                              <Package className="h-3 w-3 text-secondary" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
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
                  {items.map((item, index) => (
                    <FieldGroup key={item.id} className="grid md:grid-cols-12 gap-2 items-end">
                      <Field className="md:col-span-4">
                        <FieldLabel className="text-xs">Material</FieldLabel>
                        <Select
                          value={item.name}
                          onValueChange={(v) => updateItem(item.id, "name", v)}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((mat) => (
                              <SelectItem key={mat.value} value={mat.value}>
                                {mat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field className="md:col-span-1">
                        <FieldLabel className="text-xs">Quantity</FieldLabel>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          className="bg-background"
                        />
                      </Field>

                      <Field className="md:col-span-2">
                        <FieldLabel className="text-xs">Unit</FieldLabel>
                        <Select
                          value={item.unit}
                          onValueChange={(v) => updateItem(item.id, "unit", v)}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field className="md:col-span-2">
                        <FieldLabel className="text-xs">
                          Harga per Unit
                        </FieldLabel>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", e.target.value)
                          }
                          className="bg-background"
                        />
                      </Field>

                      <Field className="md:col-span-2">
                        <FieldLabel className="text-xs">
                          Sub Total
                        </FieldLabel>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", e.target.value)
                          }
                          className="bg-background"
                        />
                      </Field>

                      <Field className="col-span-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
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

                {/* Subtotal */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="font-mono text-lg font-semibold text-card-foreground">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(calculateTotal())}
                  </span>
                </div>
              </div>
            )}

            {/* Non-material amount field */}
            {!isMaterialCategory && category && (
              <Field>
                <FieldLabel>Amount (IDR)</FieldLabel>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  className="bg-background font-mono"
                />
              </Field>
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
            <Field>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <Textarea
                placeholder="Add any additional notes..."
                className="min-h-[80px] bg-background"
              />
            </Field>

            {/* Receipt Upload */}
            <Field>
              <FieldLabel>Attach Receipt</FieldLabel>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-8 transition-colors hover:border-primary/50 hover:bg-accent/50">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-card-foreground">
                    Drop files here or click to upload
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            </Field>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save Expense</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
