"use client";

import { BanknoteArrowDown, Landmark, QrCodeIcon, XIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CashPanel } from "./payment-display/CashPanel";
import { TransferPanel } from "./payment-display/BankTransferPanel";
import { PaymentChannelEnum, z } from "@repo/schemas";
import { ComponentType, useState } from "react";
import { CartItem } from "./pos-view";
import PaymentChannel from "./payment-display/payment-channel";
import { toIDR } from "../../../utils/format-money";

interface PosPaymentDialogProps {
  openPayment: boolean;
  setOpenPayment: (open: boolean) => void;
  clearCart: () => void;
  cart: CartItem[];
  totalShopping: number;
}

export type PAYMENT_METHOD = {
  paymentId: number;
  code: string;
  name: string;
  paymentChannel: string;
};

const PAYMENT_METHOD = [
  { paymentId: 1, code: "cash", name: "Cash", paymentChannel: "CASH" },
  {
    paymentId: 2,
    code: "502199334050",
    name: "BRI",
    paymentChannel: "BANK_TRANSFER",
  },
  {
    paymentId: 3,
    code: "342355661090",
    name: "BNI",
    paymentChannel: "BANK_TRANSFER",
  },
  { paymentId: 4, code: "qris", name: "QRIS", paymentChannel: "MIDTRANS" },
];

export default function PosPaymentDialog({
  openPayment,
  setOpenPayment,
  clearCart,
  cart,
  totalShopping,
}: PosPaymentDialogProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const selectedPayment = PAYMENT_METHOD.find(
    (pm) => pm.paymentId === selected,
  );

  const handleSuccess = () => {
    clearCart();
  };

  const handleOpenChange = (open: boolean) => {
    setOpenPayment(open);
    if (!open) {
      setSelected(null);
    }
  };

  return (
    <Dialog open={openPayment} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Proses Pembayaran</DialogTitle>
          <DialogDescription className="text-base">
            Pilih metode pembayaran dan konfirmasi untuk menyelasaikan Transaksi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-row justify-between gap-3">
                <span>Pelanggan</span>
                <span>Walk-in</span>
              </div>
              <div className="flex flex-col gap-1">
                {cart.map((c) => (
                  <div
                    key={c.productVariantId}
                    className="flex flex-row justify-between gap-3"
                  >
                    <div className="flex flex-row gap-2">
                      <span>{c.name}</span>
                      <span hidden={!c.variantOption}>- {c.variantOption}</span>
                    </div>
                    <span className="flex items-center">
                      {c.qty}
                      <XIcon size={12} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-row justify-between gap-3">
                <span>Total</span>
                <span>{toIDR(totalShopping)}</span>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <PaymentChannel
              paymentData={PAYMENT_METHOD}
              setSelected={setSelected}
            />
            {selectedPayment?.paymentChannel === "CASH" && (
              <CashPanel
                total={totalShopping}
                cartPayload={cart}
                onSuccess={handleSuccess}
              />
            )}
            {selectedPayment?.paymentChannel === "BANK_TRANSFER" && (
              <TransferPanel
                method="TRANSFER_BNI"
                total={totalShopping}
                cartPayload={cart}
                paymentData={selectedPayment}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
