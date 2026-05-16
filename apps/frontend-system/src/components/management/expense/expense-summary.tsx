import { Card, CardContent } from "@/components/ui/card";
import { useExpenseOperation } from "@/hooks/management/expense/use-expense-operations";
import { ExpenseFilters } from "@/lib/queries/expense/expense.query";
import { toIDR } from "../../../../utils/format-money";
import { BanknoteArrowDown, CirclePile, HandCoins, Package, TrendingDown } from "lucide-react";

export default function ExpenseSummary() {
  const { fetchExpenseSummaryData } = useExpenseOperation({});
  const summary = fetchExpenseSummaryData?.data;

  return (
    <>
      <Card className="py-0 bg-background shadow-md">
        <CardContent className="relative flex flex-1 flex-col justify-center py-7">
          <div className="absolute -right-5 -top-5 h-20 w-20 z-10 rounded-full bg-primary/10"></div>
          <div className="flex items-center justify-between mb-6 z-20">
            <div className="space-y-1">
              <h3 className="text-lg">Total Pengeluaran</h3>
              <p className="text-xs">Tahun Ini</p>
            </div>
            <div className="h-8 w-8 flex justify-center items-center rounded-md bg-green-900/10">
              <BanknoteArrowDown size={20} className="text-green-900" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold">
            {toIDR(summary?.totalExpense ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="py-0 bg-background shadow-md">
        <CardContent className="relative flex flex-1 flex-col justify-center py-7">
          <div className="absolute -right-5 -top-5 h-20 w-20 z-10 rounded-full bg-primary/10"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg">Total Per Bulan</h3>
              <p className="text-xs">Bulan Ini</p>
            </div>
            <div className="h-8 w-8 flex justify-center items-center rounded-md bg-red-700/10">
              <HandCoins size={20} className="text-red-700" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold">
            {toIDR(summary?.totalExpenseThisMonth ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="py-0 bg-background shadow-md">
        <CardContent className="relative flex flex-1 flex-col justify-center py-7">
          <div className="absolute -right-5 -top-5 h-20 w-20 z-10 rounded-full bg-primary/10"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg">Bahan Baku</h3>
              <p className="text-xs">Total Pengeluaran</p>
            </div>
            <div className="h-8 w-8 flex justify-center items-center rounded-md bg-secondary/10">
              <Package size={20} className="text-secondary" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold">
            {toIDR(summary?.totalExpenseRawMaterial ?? 0)}
          </h1>
        </CardContent>
      </Card>
      <Card className="py-0 bg-background shadow-md">
        <CardContent className="relative flex flex-1 flex-col justify-center py-7">
          <div className="absolute -right-5 -top-5 h-20 w-20 z-10 rounded-full bg-primary/10"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg">Pengeluaran Lainnya</h3>
              <p className="text-xs">Total Pengeluaran</p>
            </div>
            <div className="h-8 w-8 flex justify-center items-center rounded-md bg-yellow-700/10">
              <CirclePile size={20} className="text-yellow-700" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold">
            {toIDR(summary?.totalExpenseOther ?? 0)}
          </h1>
        </CardContent>
      </Card>
    </>
  );
}
