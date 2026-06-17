import {
  createPayment,
  fetchPayment,
  removePayment,
  updatePayment,
} from "@/lib/queries/payment-method/payment-method.query";
import { PaymentMethodSchemaInput } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePaymentMethodOperations = () => {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["payment-method"] });

  const fetchPaymentQuery = useQuery({
    queryKey: ["payment-method"],
    queryFn: () => fetchPayment(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      invalidate();
      toast.success("Metode pembayaran berhasil dibuat");
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PaymentMethodSchemaInput;
    }) => updatePayment(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Metode pembayaran berhasil diubah");
    },
  });

  const removePaymentMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => removePayment(id),
    onSuccess: () => {
      invalidate();
      toast.success("Metode pembayaran berhasil dihapus");
    },
  });

  return {
    fetchPaymentData: fetchPaymentQuery.data,
    createPaymentData: createPaymentMutation.mutate,
    updatePaymentData: updatePaymentMutation.mutate,
    removePaymentData: removePaymentMutation.mutate,
  }
};
