"use client";

import ExpenseCategoryChart from "@/components/management/dashboard/expense-category-chart";
import OmzetChart from "@/components/management/dashboard/omzet-chart";
import OrderTrendChart from "@/components/management/dashboard/order-trend-chart";
import ProductionStatusChart from "@/components/management/dashboard/production-status-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardOperation } from "@/hooks/management/dashboard/use-dashboard-operations";
import {
  DashboardCategoryPeriodType,
  DashboardTrendPeriodType,
} from "@repo/schemas";
import { useState } from "react";

export default function DashboardView() {
  const [orderTrendPeriod, setOrderTrendPeriod] =
    useState<DashboardTrendPeriodType>("daily");
  const [omzetTrendPeriod, setOmzetTrendPeriod] =
    useState<DashboardTrendPeriodType>("daily");
  const [expenseByCategoryPeriod, setExpenseByCategoryPeriod] =
    useState<DashboardCategoryPeriodType>("monthly");

  const {
    orderTrendData,
    isLoadingOrderTrend,
    expenseByCategoryData,
    isLoadingExpenseByCategory,
    productionStatusData,
    isLoadingProductionStatus,
    omzetTrendData,
    isLoadingOmzetTrend,
  } = useDashboardOperation({
    orderTrendPeriod,
    omzetTrendPeriod,
    expenseByCategoryPeriod,
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-3">
      <div className="grid auto-rows-min gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {isLoadingOmzetTrend || !omzetTrendData ? (
            <Skeleton className="aspect-video rounded-xl" />
          ) : (
            <OmzetChart
              data={omzetTrendData}
              period={omzetTrendPeriod}
              onPeriodChange={setOmzetTrendPeriod}
            />
          )}
        </div>
        <div className="lg:col-span-4">
          {isLoadingExpenseByCategory || !expenseByCategoryData ? (
            <Skeleton className="aspect-video w-full rounded-xl" />
          ) : (
            <ExpenseCategoryChart
              data={expenseByCategoryData}
              period={expenseByCategoryPeriod}
              onPeriodChange={setExpenseByCategoryPeriod}
            />
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoadingProductionStatus || !productionStatusData ? (
          <Skeleton className="aspect-video w-full rounded-xl" />
        ) : (
          <ProductionStatusChart data={productionStatusData} />
        )}
        {isLoadingOrderTrend || !orderTrendData ? (
          <Skeleton className="col-span-8 aspect-video rounded-xl" />
        ) : (
          <OrderTrendChart
            data={orderTrendData}
            period={orderTrendPeriod}
            onPeriodChange={setOrderTrendPeriod}
          />
        )}
      </div>
    </div>
  );
}
