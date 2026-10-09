"use client";

import { useState } from "react";
import { AdminOrderShipmentData, OrderData, z } from "@repo/schemas";
import { useOrderOperations } from "@/hooks/management/order/use-order-operations";
import { OrderFilters } from "@/lib/queries/order/order.query";
import { OrderListDataTable } from "./online-order-data-table";
import { columnsOrder } from "./online-order-column";
import { OrderShipmentSheet } from "./online-order-shipment-sheet";
import { OrderNegotiationDialog } from "./online-order-negotiation-dialog";
import OrderListFilters from "./online-order-filters";
import { Toaster } from "@/components/ui/sonner";

type OrderResponse = z.infer<typeof OrderData>;
type OrderShipment = z.infer<typeof AdminOrderShipmentData>;

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
  // Nomor pesanan disimpan terpisah karena sheet memerlukannya untuk menyimpan
  // perubahan, sementara data pengirimannya sendiri tidak membawanya.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [negotiatingOrder, setNegotiatingOrder] =
    useState<OrderResponse | null>(null);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  const {
    fetchOrdersData,
    isLoadingOrders,
    cancelOrderData,
    updateShipmentData,
    isUpdatingShipment,
    updateNegotiationData,
    isUpdatingNegotiation,
  } = useOrderOperations({
    pagination,
    filters: orderFilters,
  });

  const handleView = (order: OrderResponse) => {
    setSelectedShipment(order.shipment);
    setSelectedOrderId(order.orderId);
    setSelectedOrderStatus(order.status);
    setIsSheetOpen(true);
  };

  const handleCancel = (orderId: string) => {
    cancelOrderData([orderId]);
  };

  const handleNegotiate = (order: OrderResponse) => {
    setNegotiatingOrder(order);
    setIsNegotiationOpen(true);
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
            columns={columnsOrder(handleView, handleCancel, handleNegotiate)}
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
        orderId={selectedOrderId}
        orderStatus={selectedOrderStatus}
        isSaving={isUpdatingShipment}
        onSave={(data) =>
          updateShipmentData({ orderId: selectedOrderId!, data })
        }
      />
      <OrderNegotiationDialog
        open={isNegotiationOpen}
        onOpenChange={setIsNegotiationOpen}
        order={negotiatingOrder}
        isSaving={isUpdatingNegotiation}
        onSave={(data) => {
          // Dijaga, bukan dipaksa dengan `!`. Tanda seru itu hanya membungkam
          // TypeScript; saat runtime pembacaan `.orderId` pada null tetap
          // meledak dan galatnya muncul jauh dari penyebabnya.
          if (!negotiatingOrder) {
            throw new Error("Pesanan belum dipilih");
          }

          return updateNegotiationData({
            orderId: negotiatingOrder.orderId,
            data,
          });
        }}
      />
      <Toaster />
    </div>
  );
}
