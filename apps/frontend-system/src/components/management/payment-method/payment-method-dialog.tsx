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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePaymentMethodOperations } from "@/hooks/management/payment-method/use-payment-method-operations";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PaymentChannelEnum,
  PaymentMethodSchema,
  PaymentMethodSchemaInput,
  PaymentResponseData,
  z,
} from "@repo/schemas";
import {
  BanknoteArrowDown,
  ImagePlus,
  Landmark,
  Loader2,
  QrCodeIcon,
  ScanLine,
  X,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  compressImage,
  MAX_UPLOAD_BYTES,
} from "../../../../utils/compress-image";
import { ComponentType, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

type PaymentChannel = z.infer<typeof PaymentChannelEnum>;
const paymentChannel = PaymentChannelEnum.options;
const paymentIcon: Record<PaymentChannel, ComponentType> = {
  CASH: BanknoteArrowDown,
  BANK_TRANSFER: Landmark,
  MIDTRANS: QrCodeIcon,
  QRIS_STATIC: ScanLine,
};

/**
 * Nama yang dibaca admin.
 *
 * Ditulis satu per satu, bukan dirangkai dari nama enum: dua channel sama-sama
 * QRIS, dan yang membedakannya hanya cara kerjanya — nama hasil rangkaian
 * otomatis ("Qris Static") tidak menjelaskan apa pun.
 */
const paymentChannelLabel: Record<PaymentChannel, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  MIDTRANS: "QRIS Midtrans",
  QRIS_STATIC: "QRIS Tempel",
};

const paymentChannelData = paymentChannel.map((pc) => ({
  value: pc,
  icon: paymentIcon[pc],
  name: paymentChannelLabel[pc],
}));

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
    storeId: paymentData?.storeId ?? null,
    qrisAccount: {
      merchantName: paymentData?.merchantName ?? "",
      qrImage: paymentData?.qrImage ?? "",
    },
    bankAccount: {
      bankName: paymentData?.bankName ?? "",
      accountName: paymentData?.accountName ?? "",
      accountNumber: paymentData?.accountNumber ?? "",
    },
  };

  const { control, handleSubmit, setValue, reset } =
    useForm<PaymentMethodSchemaInput>({
      resolver: zodResolver(PaymentMethodSchema),
      values: initialValues,
    });

  const channelChange = useWatch({
    control: control,
    name: "channel",
  });

  const {
    createPaymentData,
    updatePaymentData,
    uploadQrisImageAsync,
    isUploadingQris,
  } = usePaymentMethodOperations();
  const [isPreparingQr, setIsPreparingQr] = useState(false);
  const { storeList } = useStoreOperations({ enableStoreList: true });

  const onSubmit = (data: PaymentMethodSchemaInput) => {
    // Dialog ditutup hanya saat berhasil — kalau ditutup lebih dulu, pesan
    // galat tampil ke layar yang sudah kosong dan data yang diisi hilang.
    const onSuccess = () => setOpen(false);
    if (idData) {
      updatePaymentData({ id: idData, data }, { onSuccess });
    } else {
      createPaymentData(data, { onSuccess });
    }
  };

  const handleOpenDialog = (open: boolean) => {
    setOpen(open);
    onOpenChange(open);
    if (!open) {
      reset({
        name: "",
        channel: "CASH",
        isActive: false,
        storeId: null,
        qrisAccount: { merchantName: "", qrImage: "" },
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
                render={({ field, fieldState }) => (
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
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
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
              <Controller
                control={control}
                name="storeId"
                render={({ field }) => (
                  <Field>
                    <FieldTitle>Berlaku di toko</FieldTitle>
                    <Select
                      value={field.value ?? "all"}
                      onValueChange={(value) =>
                        field.onChange(value === "all" ? null : value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua toko" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="all">Semua toko</SelectItem>
                        {(storeList?.data ?? []).map((store) => (
                          <SelectItem key={store.id} value={String(store.id)}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Rekening dan QRIS sebaiknya dipilihkan tokonya, karena
                      uangnya masuk ke rekening toko itu. Tunai biasanya
                      dibiarkan berlaku di semua toko.
                    </FieldDescription>
                  </Field>
                )}
              />
              {channelChange === "QRIS_STATIC" && (
                <Card>
                  <CardContent>
                    <FieldGroup>
                      <Controller
                        control={control}
                        name="qrisAccount.merchantName"
                        render={({ field }) => (
                          <Field>
                            <FieldTitle>Nama merchant di QR</FieldTitle>
                            <Input
                              placeholder="Contoh: NURFA CRAFT BALI"
                              {...field}
                            />
                            <FieldDescription>
                              Ditampilkan ke kasir supaya mereka bisa memastikan
                              pembeli memindai QR toko yang benar.
                            </FieldDescription>
                          </Field>
                        )}
                      />

                      <Controller
                        control={control}
                        name="qrisAccount.qrImage"
                        render={({ field }) => (
                          <Field>
                            <FieldTitle>Gambar QR</FieldTitle>
                            {field.value ? (
                              <div className="relative aspect-square w-40 overflow-hidden rounded-md border">
                                <Image
                                  src={field.value}
                                  alt="QRIS toko"
                                  fill
                                  sizes="160px"
                                  className="object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-1 top-1 size-6"
                                  aria-label="Hapus gambar QR"
                                  onClick={() => field.onChange("")}
                                >
                                  <X className="size-3" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex aspect-square w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent/40">
                                {isPreparingQr || isUploadingQris ? (
                                  <Loader2 className="size-5 animate-spin" />
                                ) : (
                                  <ImagePlus className="size-5" />
                                )}
                                <span>Unggah QR</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    if (!file) return;

                                    setIsPreparingQr(true);
                                    try {
                                      const compressed =
                                        await compressImage(file);
                                      if (compressed.size > MAX_UPLOAD_BYTES) {
                                        toast.error("Gambar terlalu besar", {
                                          description:
                                            "Maksimal 2MB setelah dikecilkan.",
                                        });
                                        return;
                                      }
                                      const url =
                                        await uploadQrisImageAsync(compressed);
                                      if (url) field.onChange(url);
                                    } catch {
                                      // Galatnya sudah ditampilkan mutation.
                                    } finally {
                                      setIsPreparingQr(false);
                                    }
                                  }}
                                />
                              </label>
                            )}
                            <FieldDescription>
                              Foto atau tangkapan layar QRIS tercetak milik toko
                              ini. Pastikan kodenya terbaca jelas.
                            </FieldDescription>
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}

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
