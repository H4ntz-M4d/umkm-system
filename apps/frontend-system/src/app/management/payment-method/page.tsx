"use client";

import { columnsPaymentMethod } from "@/components/management/payment-method/payment-method-column";
import { DataTablePaymentMethod } from "@/components/management/payment-method/payment-method-datatable";
import PaymentMethodDialog from "@/components/management/payment-method/payment-method-dialog";
import { Button } from "@/components/ui/button";
import { InputGroupInlineStart } from "@/components/ui/search";
import { usePaymentMethodOperations } from "@/hooks/management/payment-method/use-payment-method-operations";
import { useState } from "react";

export default function Page() {
  const [open, setOpen] = useState(false);
  const [idData, setIddata] = useState<string | null>(null);
  const { fetchPaymentData, removePaymentData } = usePaymentMethodOperations();

  const deleteByIdData = (id: string) => {
    removePaymentData({ id });
  };

  const selectedData = fetchPaymentData?.data.find((p) => p.id === idData);
  return (
    <main className="flex flex-1 flex-col gap-4 py-4 px-6 pt-0">
      <div className="my-5 flex flex-row justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-4xl font-instrument">Metode Pembayaran</h2>
          <p className="text-sm">
            Kelola metode pembayaran yang digunakan oleh sistem anda di sini
          </p>
        </div>
        <PaymentMethodDialog
          open={open}
          setOpen={setOpen}
          idData={idData}
          paymentData={selectedData}
        />
      </div>
      <div className="flex items-center gap-3 w-full">
        <InputGroupInlineStart />
      </div>
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTablePaymentMethod
          columns={columnsPaymentMethod(deleteByIdData, setIddata, setOpen)}
          data={fetchPaymentData?.data ?? []}
        />
      </div>
    </main>
  );
}
