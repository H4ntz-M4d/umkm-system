"use client";

import StockAdjustmentView from "@/components/management/stock-adjustment/adjustment-view";
import { Toaster } from "@/components/ui/sonner";

export default function Page() {
  return (
    <>
      <StockAdjustmentView />
      <Toaster />
    </>
  );
}
