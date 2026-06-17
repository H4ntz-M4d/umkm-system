import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePaymentMethodOperations } from "@/hooks/management/payment-method/use-payment-method-operations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PaymentChannelEnum,
  PaymentMethodSchema,
  PaymentMethodSchemaInput,
  PaymentResponseData,
  z,
} from "@repo/schemas";
import { BanknoteArrowDown, Landmark, QrCodeIcon } from "lucide-react";
import { ComponentType, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

type PaymentChannel = z.infer<typeof PaymentChannelEnum>;
const paymentChannel = PaymentChannelEnum.options;
const paymentIcon: Record<PaymentChannel, ComponentType> = {
  CASH: BanknoteArrowDown,
  BANK_TRANSFER: Landmark,
  MIDTRANS: QrCodeIcon,
};
const paymentChannelData = paymentChannel.map((pc) => {
  return {
    value: pc,
    icon: paymentIcon[pc],
    name: pc
      .replaceAll("_", " ")
      .toLowerCase()
      .replace("midtrans", "QRIS")
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
  };
});

interface PaymentMethodDialogProps {
  onOpenChange: (open: boolean) => void;
  idData: string | null;
  paymentData?: PaymentResponseData;
}

export default function PaymentMethodDialog({
  onOpenChange,
  idData,
  paymentData,
}: PaymentMethodDialogProps) {
  const [open, setOpen] = useState(false);
  const isOpen = open || !!paymentData;
  const initialValues: PaymentMethodSchemaInput = {
    name: paymentData?.name ?? "",
    channel: (paymentData?.channel as PaymentChannel) ?? "CASH",
    isActive: paymentData?.isActive ?? false,
    bankAccount: {
      bankName: paymentData?.bankName ?? "",
      accountName: paymentData?.accountName ?? "",
      accountNumber: paymentData?.accountNumber ?? "",
    },
  };

  const { control, handleSubmit, formState, setValue, reset } =
    useForm<PaymentMethodSchemaInput>({
      resolver: zodResolver(PaymentMethodSchema),
      values: initialValues,
    });

  const channelChange = useWatch({
    control: control,
    name: "channel",
  });

  const { createPaymentData, updatePaymentData } = usePaymentMethodOperations();

  const onSubmit = (data: PaymentMethodSchemaInput) => {
    if (idData) {
      updatePaymentData({ id: idData, data });
    } else {
      createPaymentData(data);
    }
    setOpen(false);
  };

  const handleOpenDialog = (open: boolean) => {
    setOpen(open);
    onOpenChange(open);
    if (!open) {
      reset({
        name: "",
        channel: "CASH",
        isActive: false,
        bankAccount: {
          bankName: "",
          accountName: "",
          accountNumber: "",
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Button>Tambah metode</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[35%]">
        <form
          onSubmit={handleSubmit(onSubmit, (error) => {
            console.log(error);
          })}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              Tambah Metode Pembayaran
            </DialogTitle>
            <DialogDescription>
              Masukkan metode pembayaran yang diinginkan
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto no-scrollbar max-h-[70vh] px-1 py-5">
            <FieldGroup>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <Field>
                    <FieldTitle>Nama pembayaran</FieldTitle>
                    <Input
                      placeholder="Masukkan nama pembayaran"
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val.target.value);
                        setValue("bankAccount.bankName", val.target.value);
                      }}
                    />
                  </Field>
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                <Controller
                  control={control}
                  name="channel"
                  render={({ field }) => (
                    <>
                      {paymentChannelData.map((pc, i) => (
                        <Button
                          key={i}
                          variant={"outline"}
                          type="button"
                          className={`flex flex-col gap-2 h-auto ${field.value === pc.value ? "bg-primary/5 border ring-1 ring-primary" : ""}`}
                          onClick={() => {
                            field.onChange(pc.value);
                          }}
                        >
                          {pc.icon && <pc.icon />}
                          <p className="text-xs">{pc.name}</p>
                        </Button>
                      ))}
                    </>
                  )}
                />
              </div>
              {channelChange === "BANK_TRANSFER" && (
                <Card>
                  <CardContent>
                    <FieldGroup>
                      <Controller
                        control={control}
                        name="bankAccount.bankName"
                        render={({ field }) => (
                          <Field>
                            <FieldTitle>Nama Bank</FieldTitle>
                            <Input {...field} disabled />
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name="bankAccount.accountName"
                        render={({ field }) => (
                          <Field>
                            <FieldTitle>Nama Pemilik Akun</FieldTitle>
                            <Input placeholder="e.g. Ahmad" {...field} />
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name="bankAccount.accountNumber"
                        render={({ field }) => (
                          <Field>
                            <FieldTitle>No. Rekening</FieldTitle>
                            <Input {...field} />
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}
              <FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Field orientation={"horizontal"}>
                      <FieldContent>
                        <FieldTitle>Status Pembayaran</FieldTitle>
                        <FieldDescription>
                          Metode pembayaran dapat digunakan untuk transaksi
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(val) => field.onChange(val)}
                      />
                    </Field>
                  )}
                />
              </FieldLabel>
            </FieldGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant={"outline"} type="button">
                Kembali
              </Button>
            </DialogClose>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
