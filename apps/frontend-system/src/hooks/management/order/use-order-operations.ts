import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  fetchOrders,
  updateShipment,
  OrderFilters,
} from "@/lib/queries/order/order.query";
import type { UpdateShipmentInput } from "@repo/schemas";
import { toast } from "sonner";

export function useOrderOperations({
  pagination,
  filters,
}: {
  pagination?: { pageIndex: number; pageSize: number };
  filters?: OrderFilters;
}) {
  const qc = useQueryClient();
  const isTableMode = !!pagination;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const getOrders = useQuery({
    queryKey: [
      "orders",
      pagination?.pageIndex,
      pagination?.pageSize,
      filters ?? {},
    ],
    queryFn: () =>
      fetchOrders(pagination!.pageIndex, pagination!.pageSize, filters),
    enabled: isTableMode,
    throwOnError: true,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string[]) => cancelOrder(orderId),
    onSuccess: () => {
      invalidate();
      toast.success("Order berhasil dibatalkan");
    },
  });

  const updateShipmentMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateShipmentInput;
    }) => updateShipment(orderId, data),
    onSuccess: () => {
      invalidate();
      toast.success("Status pengiriman diperbarui");
    },
    // Pesan dari backend sudah dibuka apiFetcher, jadi cukup err.message.
    onError: (error: Error) =>
      toast.error("Gagal memperbarui pengiriman", {
        description: error.message,
      }),
  });

  return {
    fetchOrdersData: getOrders.data,
    isLoadingOrders: getOrders.isLoading,
    cancelOrderData: cancelOrderMutation.mutate,
    updateShipmentData: updateShipmentMutation.mutateAsync,
    isUpdatingShipment: updateShipmentMutation.isPending,
  };
}
