"use client";

import { XIcon } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { CashPanel } from "../payment-display/CashPanel";
import { TransferPanel } from "../payment-display/BankTransferPanel";
import { useState } from "react";
import { CartItem } from "../pos-view";
import PaymentChannel from "../payment-display/payment-channel";
import { toIDR } from "../../../../utils/format-money";
import { usePaymentMethodOperations } from "@/hooks/management/payment-method/use-payment-method-operations";
import { QrisPanel } from "../payment-display/QrisPanel";

interface PosPaymentDialogProps {
  openPayment: boolean;
  setOpenPayment: (open: boolean) => void;
  clearCart: () => void;
  cart: CartItem[];
  totalShopping: number;
  transPosId: string | null;
}

export default function PosPaymentDialog({
  openPayment,
  setOpenPayment,
  clearCart,
  cart,
  totalShopping,
  transPosId,
}: PosPaymentDialogProps) {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const { fetchPaymentData } = usePaymentMethodOperations();
  const selectedPayment = fetchPaymentData?.data.find(
    (pm) => pm.id === selected,
  );

  const handleSuccess = () => {
    clearCart();
    setOpenPayment(false)
  };

  const handleOpenChange = (open: boolean) => {
    setOpenPayment(open);
    if (!open) {
      setSelected(undefined);
    }
  };

  return (
    <Dialog open={openPayment} onOpenChange={handleOpenChange}>
      <DialogContent className="md:min-w-lg max-h-[85vh] p-6 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Proses Pembayaran</DialogTitle>
          <DialogDescription className="text-base">
            Pilih metode pembayaran dan konfirmasi untuk menyelasaikan Transaksi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar">
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
              paymentData={fetchPaymentData?.data ?? []}
              setSelected={setSelected}
            />
            {selectedPayment?.channel === "CASH" && (
              <CashPanel
                total={totalShopping}
                cartPayload={cart}
                onSuccess={handleSuccess}
                transPosId={transPosId}
                paymentId={selectedPayment.id}
              />
            )}
            {selectedPayment?.channel === "BANK_TRANSFER" && (
              <TransferPanel
                total={totalShopping}
                cartPayload={cart}
                paymentData={selectedPayment}
                onSuccess={handleSuccess}
                transPosId={transPosId}
                paymentId={selectedPayment.id}
              />
            )}
            {selectedPayment?.channel === "MIDTRANS" && (
              <QrisPanel
                total={totalShopping}
                cartPayload={cart}
                onSuccess={handleSuccess}
                transPosId={transPosId}
                paymentId={selectedPayment.id}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
