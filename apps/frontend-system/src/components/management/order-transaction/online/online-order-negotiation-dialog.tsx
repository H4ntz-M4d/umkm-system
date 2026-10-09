"use client";

import { useEffect, useState } from "react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ORDER_NEGOTIATION_TRANSITIONS,
  OrderData,
  z,
  type OrderNegotiationStatusInput,
  type UpdateOrderNegotiationInput,
} from "@repo/schemas";
import { usePaymentMethodOperations } from "@/hooks/management/payment-method/use-payment-method-operations";
import { useUsersOperation } from "@/hooks/management/users/use-users-operation";
import { useAuth } from "@/stores/useAuth";
import { toast } from "sonner";
import { toIDR } from "../../../../../utils/format-money";
import {
  buildOrderReadyWhatsAppUrl,
  buildProductionDoneWhatsAppUrl,
} from "../../../../../utils/whatsapp";

type OrderResponse = z.infer<typeof OrderData>;

/**
 * Status yang boleh dituju dari status sekarang — peta yang sama persis
 * dengan yang ditegakkan server (`ORDER_NEGOTIATION_TRANSITIONS`), jadi
 * keduanya tidak bisa menyimpang.
 *
 * Satu pengecualian yang bergantung pada pesanannya: pesanan berkurir
 * ditandai Selesai lewat sheet pengiriman (Diterima), bukan dari sini.
 */
function nextStatusOptions(order: OrderResponse) {
  const options = ORDER_NEGOTIATION_TRANSITIONS[order.status] ?? [];
  return order.deliveryMethod === "SHIP"
    ? options.filter((option) => option !== "COMPLETED")
    : options;
}

/// Batal dan Refund menutup pesanan dan mengembalikan uang — form-nya beda:
/// yang diisi nominal pengembalian, bukan total/DP.
const CLOSING_STATUSES: OrderNegotiationStatusInput[] = [
  "CANCELLED",
  "REFUNDED",
];

/// Status yang berarti uangnya sudah penuh — cerminan `isSettled` di
/// order.service.ts. Begitu salah satu ini tercapai, field DP tidak lagi
/// diinput manual: backend menyamakannya paksa dengan total.
const SETTLED_STATUSES: OrderNegotiationStatusInput[] = [
  "PAID",
  "SHIPPED",
  "COMPLETED",
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Mengajukan",
  DP: "DP Dibayar",
  PRODUCTION_DONE: "Produksi Selesai",
  PAID: "Lunas",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dana Dikembalikan",
};

/// Angka diketik apa adanya lalu dibersihkan di sini, supaya admin boleh
/// mengetik "500.000" maupun "500000".
const toNumber = (value: string) => Number(value.replace(/[^\d]/g, ""));

/**
 * Galat per-field, bukan satu string generik.
 *
 * Sebelumnya semua penolakan — total tidak valid, DP kelebihan, status DP
 * tanpa nominal — ditumpuk jadi satu `<FieldError>` di bagian paling bawah
 * form, lepas dari field mana yang sebenarnya salah. Admin harus menebak
 * sendiri kolom mana yang perlu dibetulkan.
 *
 * `form` menampung galat dari server yang tidak jelas menempel ke satu field
 * tertentu (mis. kuota pre-order habis, kuota tidak ditemukan) — tetap
 * ditampilkan di dalam form, bukan cuma lewat toast yang gampang terlewat.
 */
type FieldErrors = {
  total?: string;
  dp?: string;
  refund?: string;
  form?: string;
};

interface NegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResponse | null;
  onSave: (data: UpdateOrderNegotiationInput) => Promise<unknown>;
  isSaving?: boolean;
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

export function OrderNegotiationDialog({
  open,
  onOpenChange,
  order,
  onSave,
  isSaving = false,
}: NegotiationDialogProps) {
  const [totalAmount, setTotalAmount] = useState("");
  const [dpAmount, setDpAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [status, setStatus] = useState<OrderNegotiationStatusInput | "">("");
  const [refundAmount, setRefundAmount] = useState("");
  const [processedById, setProcessedById] = useState("");
  const [restock, setRestock] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /// Metode milik toko pemenuh pesanan ini saja (ditambah yang berlaku umum).
  /// Server menolak metode toko lain, jadi daftarnya pun jangan menawarkannya.
  const { fetchPaymentData } = usePaymentMethodOperations(
    order?.storeId ?? null,
  );
  const { employeeOptions } = useUsersOperation({
    enabledEmployeeOptions: true,
  });
  const me = useAuth((state) => state.user);

  // Form diisi ulang tiap dialog dibuka supaya tidak membawa sisa pesanan yang
  // dilihat sebelumnya.
  useEffect(() => {
    if (!open || !order) return;

    setTotalAmount(String(Math.trunc(Number(order.totalAmount))));
    setDpAmount(
      order.dpAmount ? String(Math.trunc(Number(order.dpAmount))) : "",
    );
    setPaymentMethodId("");
    setStatus("");
    setRefundAmount("");
    setProcessedById("");
    setRestock(false);
    setFieldErrors({});
  }, [open, order]);

  if (!order) return null;

  const nextTotal = toNumber(totalAmount);
  const nextDp = dpAmount.trim() === "" ? null : toNumber(dpAmount);
  const remaining = nextTotal - (nextDp ?? 0);
  /**
   * Nama yang berlaku kalau disimpan sekarang, dihitung berjenjang:
   * pilihan admin barusan → pemroses yang sudah tercatat → akun sendiri.
   *
   * Dihitung, bukan disimpan ke state lewat useEffect, supaya tidak ada
   * balapan antara pengisian ulang form dan datangnya daftar karyawan.
   * Urutannya juga yang mewujudkan aturan servernya: pesanan yang sudah punya
   * pemroses menampilkan orang itu, bukan siapa pun yang kebetulan membuka.
   */
  const effectiveProcessedById =
    processedById || order.processedById || me?.id || "";

  const statusOptions = nextStatusOptions(order);
  const isClosing = status !== "" && CLOSING_STATUSES.includes(status);

  /// Uang yang sudah diterima dari customer — batas atas pengembalian. Untuk
  /// pesanan lunas `dpAmount` sudah disamakan dengan total oleh server.
  const paidSoFar = order.dpAmount ? Math.trunc(Number(order.dpAmount)) : 0;
  /// Bawaan kalau kolomnya dikosongkan: Batal → 0 (DP hangus), Refund →
  /// seluruh yang sudah dibayar. Sama dengan bawaan di server.
  const refundValue =
    refundAmount.trim() === ""
      ? status === "REFUNDED"
        ? paidSoFar
        : 0
      : toNumber(refundAmount);

  /// Status yang BERLAKU kalau disimpan sekarang — status baru yang dipilih,
  /// atau status pesanan saat ini kalau admin tidak menggantinya (mis. cuma
  /// mengubah channel pembayaran pada pesanan yang sudah Lunas).
  const effectiveStatus = status || order.status;
  const isSettling = SETTLED_STATUSES.includes(
    effectiveStatus as OrderNegotiationStatusInput,
  );

  const isDirty =
    nextTotal !== Math.trunc(Number(order.totalAmount)) ||
    (nextDp ?? null) !==
      (order.dpAmount ? Math.trunc(Number(order.dpAmount)) : null) ||
    status !== "" ||
    paymentMethodId !== "" ||
    /// Tanpa baris ini, mengubah HANYA dropdown pemroses membuat tombol
    /// Simpan tetap mati — terlihat seperti dropdownnya tidak berfungsi.
    effectiveProcessedById !== (order.processedById ?? "");

  const handleClose = async () => {
    if (refundValue > paidSoFar) {
      setFieldErrors({
        refund: `Tidak boleh melebihi yang sudah dibayar (${toIDR(paidSoFar)})`,
      });
      return;
    }

    try {
      await onSave({
        status: status as OrderNegotiationStatusInput,
        refundAmount: refundValue,
        ...(status === "REFUNDED" && { restock }),
        ...(effectiveProcessedById && { userId: effectiveProcessedById }),
      });
      onOpenChange(false);
    } catch (err) {
      setFieldErrors({
        form: err instanceof Error ? err.message : "Gagal menyimpan",
      });
    }
  };

  const handleSave = async () => {
    setFieldErrors({});

    if (isClosing) {
      await handleClose();
      return;
    }

    // Dicegat di sini juga, bukan hanya di server: admin tidak perlu menunggu
    // perjalanan bolak-balik untuk tahu angkanya keliru. Tiap penolakan
    // ditaruh di field yang relevan, bukan satu pesan generik di bawah form.
    if (nextTotal <= 0) {
      setFieldErrors({ total: "Total kesepakatan harus lebih dari 0" });
      return;
    }
    // Dilewati saat isSettling: field DP terkunci dan nilainya diabaikan
    // backend (disamakan paksa dengan total), jadi nilai lama yang masih
    // tersimpan di state tidak boleh ikut menahan simpan hanya karena Total
    // baru saja diedit lebih kecil dari DP lama.
    if (!isSettling && nextDp !== null && nextDp > nextTotal) {
      setFieldErrors({
        dp: "Nominal DP tidak boleh melebihi total kesepakatan",
      });
      return;
    }
    if (status === "DP" && (nextDp === null || nextDp <= 0)) {
      setFieldErrors({
        dp: "Isi nominal DP yang sudah dibayar sebelum menandai status DP",
      });
      return;
    }

    try {
      await onSave({
        totalAmount: nextTotal,
        dpAmount: nextDp,
        ...(paymentMethodId && { paymentMethodId }),
        ...(status && { status }),
        ...(effectiveProcessedById && { userId: effectiveProcessedById }),
      });

      /**
       * Baru ditandai Lunas / Produksi Selesai → arahkan admin ke WA customer.
       *
       * Dicek dari `status` (pilihan admin barusan), bukan `order.status`:
       * `status` cuma terisi kalau admin memang baru memindahkannya ke salah
       * satu status ini di submit ini — mengedit hal lain pada pesanan yang
       * SUDAH berstatus itu (mis. ganti channel pembayaran) tidak boleh
       * memicu WA lagi.
       *
       * Pesannya BEDA untuk dua status ini meski triggernya mirip: Lunas
       * mengonfirmasi pembayaran selesai, Produksi Selesai justru MEMINTA
       * pelunasan — makanya dua message builder terpisah di utils/whatsapp.
       */
      if (status === "PAID" || status === "PRODUCTION_DONE") {
        const items = order.items.map((item) => ({
          productName: item.productName,
          quantity: Number(item.quantity),
        }));

        const waUrl =
          status === "PAID"
            ? order.buyerPhone &&
              buildOrderReadyWhatsAppUrl({
                orderId: order.orderId,
                buyerName: order.customerName || "Pelanggan",
                buyerPhone: order.buyerPhone,
                deliveryMethod: order.deliveryMethod,
                items,
              })
            : order.buyerPhone &&
              buildProductionDoneWhatsAppUrl({
                orderId: order.orderId,
                buyerName: order.customerName || "Pelanggan",
                buyerPhone: order.buyerPhone,
                deliveryMethod: order.deliveryMethod,
                items,
                totalAmount: nextTotal,
                dpAmount: order.dpAmount,
              });

        const successTitle =
          status === "PAID"
            ? "Pesanan ditandai lunas"
            : "Produksi ditandai selesai";

        // Pesanan lama dari alur Midtrans (sebelum fitur WA ini ada) tidak
        // punya buyerPhone — dikabari lewat toast biasa saja, tidak ada
        // nomor untuk dituju.
        if (waUrl) {
          // Dibuka otomatis, tapi bisa saja ditahan pemblokir popup karena
          // ini terjadi setelah `await` — tombol di toast jadi jalan kedua.
          window.open(waUrl, "_blank", "noopener,noreferrer");
          toast.success(successTitle, {
            description: "WhatsApp ke customer sudah dibuka.",
            action: {
              label: "Buka lagi",
              onClick: () =>
                window.open(waUrl, "_blank", "noopener,noreferrer"),
            },
          });
        } else {
          toast.success(successTitle, {
            description:
              "Tidak ada nomor WhatsApp tercatat untuk pesanan ini (pesanan lama) — kabari customer secara manual.",
          });
        }
      }

      onOpenChange(false);
    } catch (err) {
      // Toast galatnya sudah ditampilkan mutation (hook-level, tetap jalan).
      // Di sini pesannya DITAMPILKAN JUGA di dalam form — galat seperti
      // "kuota pre-order tersisa 24, tidak cukup untuk 25 pcs" gampang
      // terlewat kalau cuma lewat toast yang hilang sendiri. Dialog sengaja
      // dibiarkan terbuka supaya admin bisa membetulkan tanpa mengetik ulang.
      setFieldErrors({
        form:
          err instanceof Error ? err.message : "Gagal menyimpan kesepakatan",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Catat Kesepakatan</DialogTitle>
          <DialogDescription>
            Pesanan {order.orderId} — isi harga yang disepakati di WhatsApp dan
            DP yang sudah diterima.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 px-1">
            <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pemesan</span>
                <span className="text-sm font-medium">
                  {order.customerName || "-"}
                </span>
              </div>
              {order.buyerPhone && (
                <SummaryRow label="Nomor WhatsApp" value={order.buyerPhone} />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>
              <SummaryRow
                label="Pengambilan"
                value={
                  order.deliveryMethod === "PICKUP"
                    ? "Ambil di tempat"
                    : "Dikirim"
                }
              />
              {/* Perkiraan dari harga katalog — pembanding, bukan patokan. */}
              <SummaryRow
                label="Perkiraan awal"
                value={toIDR(order.estimatedTotal)}
                muted
              />
            </div>

            {/* Permintaan custom adalah bahan negonya, jadi ditampilkan di sini
                supaya admin tidak perlu membuka detail pesanan terpisah. */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Item</p>
              {order.items.map((item) => (
                <div key={item.id} className="rounded-lg border p-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>{item.productName}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {item.quantity}x
                    </span>
                  </div>
                  {item.notes && (
                    <p className="mt-1 rounded bg-secondary/10 px-2 py-1 text-xs text-muted-foreground">
                      Permintaan: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!isClosing && (
              <>
                <Field>
                  <FieldLabel>Total disepakati</FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={totalAmount}
                    onChange={(event) => setTotalAmount(event.target.value)}
                    placeholder="500000"
                  />
                  {fieldErrors.total ? (
                    <FieldError>{fieldErrors.total}</FieldError>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Bebas, tidak terikat perkiraan di atas.
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel>DP sudah dibayar</FieldLabel>
                  {isSettling ? (
                    /**
                     * Dikunci, bukan cuma disabled — begitu status berarti lunas,
                     * field ini tidak lagi berarti "sebagian sudah masuk". Admin
                     * dulu harus menebak sendiri apakah perlu mengetik ulang
                     * nominal ini saat menandai Lunas; sekarang tidak perlu sama
                     * sekali karena backend menyamakannya otomatis dengan Total.
                     */
                    <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      Otomatis dianggap lunas penuh ({toIDR(nextTotal)}) — tidak
                      perlu diisi manual.
                    </p>
                  ) : (
                    <>
                      <Input
                        inputMode="numeric"
                        value={dpAmount}
                        onChange={(event) => setDpAmount(event.target.value)}
                        placeholder="Kosongkan kalau belum ada DP"
                      />
                      {fieldErrors.dp ? (
                        <FieldError>{fieldErrors.dp}</FieldError>
                      ) : (
                        nextTotal > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Sisa tagihan {toIDR(Math.max(remaining, 0))}
                          </p>
                        )
                      )}
                      {/* Boleh, bukan galat: customer yang membayar penuh
                      sebelum barangnya jadi memang dicatat begini, karena
                      Lunas mensyaratkan barangnya sudah ada di toko. */}
                      {!fieldErrors.dp &&
                        effectiveStatus === "DP" &&
                        nextDp !== null &&
                        nextTotal > 0 &&
                        nextDp === nextTotal && (
                          <p className="rounded-md bg-secondary/10 px-2 py-1.5 text-xs text-muted-foreground">
                            DP sama dengan total: customer sudah bayar penuh.
                            Biarkan status DP selama barangnya belum siap;
                            tandai Lunas begitu barangnya ada di toko.
                          </p>
                        )}
                    </>
                  )}
                </Field>

                <Field>
                  <FieldLabel>DP/pelunasan masuk lewat (opsional)</FieldLabel>
                  <Select
                    value={paymentMethodId}
                    onValueChange={setPaymentMethodId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {fetchPaymentData?.data
                        ?.filter((method) => method.isActive)
                        .map((method) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            <Field>
              <FieldLabel>Diproses oleh</FieldLabel>
              <Select
                value={effectiveProcessedById}
                onValueChange={setProcessedById}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                      <span className="text-xs text-muted-foreground">
                        ({employee.role})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {order.processedByName
                  ? `Tercatat: ${order.processedByName}. Ganti kalau yang menangani orang lain.`
                  : "Bawaannya akun Anda. Ganti kalau yang menangani orang lain."}
              </p>
            </Field>

            <Field>
              <FieldLabel>Ubah status</FieldLabel>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as OrderNegotiationStatusInput)
                }
                disabled={statusOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      statusOptions.length === 0
                        ? "Status ini sudah tidak bisa digeser"
                        : "Biarkan seperti sekarang"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {STATUS_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Efek yang tidak kelihatan dari layar dikatakan lebih dulu:
                  lunas menggerakkan stok, kuota, dan kas. */}
              {status === "PAID" && (
                <p className="text-xs text-muted-foreground">
                  Menandai lunas mencatat sisa pembayaran sebagai kas masuk,
                  mengurangi kuota pre-order, dan mengunci stok barangnya di
                  toko (tidak bisa dijual kasir) sampai pesanan Selesai. Ditolak
                  kalau stok di toko belum cukup.
                </p>
              )}
              {status === "DP" && (
                <p className="text-xs text-muted-foreground">
                  Nominal DP dicatat sebagai kas masuk.
                </p>
              )}
              {status === "COMPLETED" && (
                <p className="text-xs text-muted-foreground">
                  Barang sudah diambil customer: stok yang dikunci resmi keluar.
                  Pesanan tidak bisa diubah lagi setelah ini.
                </p>
              )}
              {order.status === "SHIPPED" && (
                <p className="text-xs text-muted-foreground">
                  Pesanan ini ditandai Selesai lewat menu pengiriman (status
                  Diterima). Dari sini hanya bisa Refund.
                </p>
              )}
              {order.deliveryMethod === "SHIP" && order.status === "PAID" && (
                <p className="text-xs text-muted-foreground">
                  Status Dikirim diatur lewat menu pengiriman.
                </p>
              )}
            </Field>

            {isClosing && (
              <div className="space-y-3 rounded-xl border border-destructive/30 p-3">
                <Field>
                  <FieldLabel>
                    {status === "REFUNDED"
                      ? "Uang yang dikembalikan"
                      : "Uang yang dikembalikan (opsional)"}
                  </FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    placeholder={
                      status === "REFUNDED"
                        ? String(paidSoFar)
                        : "0 — kosongkan kalau DP hangus"
                    }
                  />
                  {fieldErrors.refund ? (
                    <FieldError>{fieldErrors.refund}</FieldError>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sudah dibayar {toIDR(paidSoFar)}. Dicatat sebagai kas
                      keluar {toIDR(refundValue)}.
                    </p>
                  )}
                </Field>

                {status === "REFUNDED" && (
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={restock}
                      onCheckedChange={(checked) =>
                        setRestock(checked === true)
                      }
                      className="mt-0.5"
                    />
                    <span>
                      Barang kembali dan layak dijual lagi
                      <span className="block text-xs text-muted-foreground">
                        Dicentang: stok bertambah dan kuota pre-order
                        dikembalikan. Tidak dicentang: barang dicatat keluar
                        sebagai hilang.
                      </span>
                    </span>
                  </label>
                )}

                {status === "CANCELLED" &&
                  (order.status === "PAID" ? (
                    <p className="text-xs text-muted-foreground">
                      Barang pesanan ini kembali ke stok toko (bisa dijual
                      kasir) dan kuota pre-order dikembalikan.
                    </p>
                  ) : null)}

                <p className="text-xs font-medium text-destructive">
                  Pesanan tidak bisa diubah lagi setelah ini.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Galat dari server (mis. kuota pre-order tersisa sekian) tidak
            menempel ke satu field tertentu, jadi ditampilkan di sini —
            menonjol, tepat sebelum tombol Simpan, bukan tenggelam di tengah
            form. */}
        {fieldErrors.form && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {fieldErrors.form}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={isClosing ? "destructive" : "default"}
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving
              ? "Menyimpan..."
              : status === "CANCELLED"
                ? "Batalkan pesanan"
                : status === "REFUNDED"
                  ? "Catat refund"
                  : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
