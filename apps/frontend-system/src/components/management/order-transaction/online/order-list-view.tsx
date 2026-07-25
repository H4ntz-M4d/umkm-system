"use client";

import { useState } from "react";
import { OrderData, OrderShipmentData, z } from "@repo/schemas";
import { useOrderOperations } from "@/hooks/management/order/use-order-operations";
import { OrderFilters } from "@/lib/queries/order/order.query";
import { OrderListDataTable } from "./online-order-data-table";
import { columnsOrder } from "./online-order-column";
import { OrderShipmentSheet } from "./online-order-shipment-sheet";
import OrderListFilters from "./online-order-filters";

type OrderResponse = z.infer<typeof OrderData>;
type OrderShipment = z.infer<typeof OrderShipmentData>;

interface OrderListViewProps {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange: (val: any) => void;
  orderFilters?: OrderFilters;
  handleUpdateParams: (key: string, val: string | number | undefined) => void;
}

export default function OrderListView({
  pagination,
  onPaginationChange,
  orderFilters,
  handleUpdateParams,
}: OrderListViewProps) {
  const [selectedShipment, setSelectedShipment] =
    useState<OrderShipment | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { fetchOrdersData, isLoadingOrders, cancelOrderData } =
    useOrderOperations({
      pagination,
      filters: orderFilters,
    });

  const handleView = (order: OrderResponse) => {
    setSelectedShipment(order.shipment);
    setIsSheetOpen(true);
  };

  const handleCancel = (orderId: string) => {
    cancelOrderData([orderId]);
  };

  const pageCount = fetchOrdersData?.meta.total
    ? Math.ceil(fetchOrdersData.meta.total / pagination.pageSize)
    : 1;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <OrderListFilters
        filters={orderFilters}
        handleUpdateParams={handleUpdateParams}
      />
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        {isLoadingOrders && !fetchOrdersData ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <OrderListDataTable
            data={fetchOrdersData?.data ?? []}
            columns={columnsOrder(handleView, handleCancel)}
            pagination={pagination}
            pageCount={pageCount}
            onPaginationChange={onPaginationChange}
          />
        )}
      </div>
      <OrderShipmentSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        shipment={selectedShipment}
      />
    </div>
  );
}
