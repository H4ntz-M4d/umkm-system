import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  fetchOrders,
  OrderFilters,
} from "@/lib/queries/order/order.query";
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

  return {
    fetchOrdersData: getOrders.data,
    isLoadingOrders: getOrders.isLoading,
    cancelOrderData: cancelOrderMutation.mutate,
  };
}
