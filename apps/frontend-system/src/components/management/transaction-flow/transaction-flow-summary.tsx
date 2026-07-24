"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTransactionFlowOperations } from "@/hooks/management/transaction-flow/use-transaction-flow-operations";
import { TransactionFlowFilter } from "@/lib/queries/transaction-flow/transaction-flow.query";
import { toIDR } from "../../../../utils/format-money";

export default function TransactionFlowSummaryComponents({
  filters,
}: {
  filters: TransactionFlowFilter;
}) {
  const { getTransactionFlowSummaryData } = useTransactionFlowOperations({
    filters,
  });
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
      <Card className="h-40 bg-background shadow-md">
        <CardContent className="flex flex-col flex-1 justify-between py-2 px-5">
          <div className="space-y-1">
            <h3 className="text-xl">Transaksi Masuk</h3>
            <p className="text-sm text-muted-foreground">Bulan ini</p>
          </div>
          <h1 className="text-2xl font-bold">
            {toIDR(getTransactionFlowSummaryData?.data.transactionIn ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="h-40 bg-background shadow-md">
        <CardContent className="flex flex-col flex-1 justify-between py-2 px-5">
          <div className="space-y-1">
            <h3 className="text-xl">Transaksi Keluar</h3>
            <p className="text-sm text-muted-foreground">Bulan ini</p>
          </div>
          <h1 className="text-2xl font-bold">
            {toIDR(getTransactionFlowSummaryData?.data.transactionOut ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="h-40 bg-background shadow-md">
        <CardContent className="flex flex-col flex-1 justify-between py-2 px-5">
          <div className="space-y-1">
            <h3 className="text-xl">Saldo Bersih</h3>
            <p className="text-sm text-muted-foreground">Bulan ini</p>
          </div>
          <h1 className="text-2xl font-bold">
            {toIDR(getTransactionFlowSummaryData?.data.netTransaction ?? 0)}
          </h1>
        </CardContent>
      </Card>
    </div>
  );
}
