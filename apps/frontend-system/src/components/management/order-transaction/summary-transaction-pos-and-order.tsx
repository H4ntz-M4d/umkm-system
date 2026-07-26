import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionFlowOperations } from "@/hooks/management/transaction-flow/use-transaction-flow-operations";
import { toIDR } from "../../../../utils/format-money";

export default function SummaryTransactionPosAndOrder() {
  const { getSummaryAmountPosAndOrderData } = useTransactionFlowOperations({
    isSummaryAmountPosAndOrder: true,
  });
  const getSummary = getSummaryAmountPosAndOrderData?.data;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
      <Card className="h-40 bg-background shadow-md">
        <CardContent className="flex flex-col flex-1 justify-between py-2 px-5">
          <div className="space-y-1">
            <h3 className="text-xl">Transaksi Kasir</h3>
            <p className="text-sm text-muted-foreground">Pemasukan bulan ini</p>
          </div>
          <h1 className="text-2xl font-bold">
            {toIDR(getSummary?.posTotal ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="h-40 bg-background shadow-md">
        <CardContent className="flex flex-col flex-1 justify-between py-2 px-5">
          <div className="space-y-1">
            <h3 className="text-xl">Order Online</h3>
            <p className="text-sm text-muted-foreground">Pemasukan bulan ini</p>
          </div>
          <h1 className="text-2xl font-bold">
            {toIDR(getSummary?.orderTotal ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="h-40 bg-background shadow-md">
        <CardContent className="flex flex-col flex-1 justify-between py-2 px-5">
          <div className="space-y-1">
            <h3 className="text-xl">Total Transaksi</h3>
            <p className="text-sm text-muted-foreground">
              Jumlah transaksi (all-time)
            </p>
          </div>
          <h1 className="text-2xl font-bold">
            {getSummary?.totalTransaction ?? 0}
          </h1>
        </CardContent>
      </Card>
    </div>
  );
}
