import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  fetchOrders,
  updateOrderNegotiation,
  updateShipment,
  OrderFilters,
} from "@/lib/queries/order/order.query";
import type {
  UpdateOrderNegotiationInput,
  UpdateShipmentInput,
} from "@repo/schemas";
import { toast } from "sonner";
import { toIDR } from "../../../../utils/format-money";

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

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message.
  const showError = (title: string) => (error: Error) =>
    toast.error(title, { description: error.message });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string[]) => cancelOrder(orderId),
    onSuccess: () => {
      invalidate();
      toast.success("Order berhasil dibatalkan");
    },
    onError: showError("Gagal membatalkan pesanan"),
  });

  const updateNegotiationMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateOrderNegotiationInput;
    }) => updateOrderNegotiation(orderId, data),
    onSuccess: (result, { data }) => {
      invalidate();

      // Batal/Refund tidak punya "sisa tagihan" — yang relevan uang yang
      // dikembalikan.
      if (data.status === "CANCELLED" || data.status === "REFUNDED") {
        const refund = data.refundAmount ?? 0;
        toast.success(
          data.status === "REFUNDED" ? "Refund dicatat" : "Pesanan dibatalkan",
          {
            description:
              refund > 0
                ? `${toIDR(refund)} dicatat sebagai kas keluar.`
                : "Tidak ada uang yang dikembalikan.",
          },
        );
        return;
      }

      toast.success("Kesepakatan pesanan tersimpan", {
        description: `Sisa tagihan ${toIDR(result.data.remainingAmount)}`,
      });
    },
    onError: showError("Gagal menyimpan kesepakatan"),
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
    updateNegotiationData: updateNegotiationMutation.mutateAsync,
    isUpdatingNegotiation: updateNegotiationMutation.isPending,
  };
}
