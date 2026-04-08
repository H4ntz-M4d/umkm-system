import {
  getAdminProfile,
  getCustomerProfile,
  loginAdmin,
  loginCustomer,
  logoutAdmin,
  registerCustomer,
} from "@/lib/queries/auth/auth.api";
import { useAuth } from "@/lib/queries/auth/useAuth";
import { useCustomerAuth } from "@/lib/queries/auth/userCustomerAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuthOperations = () => {
  const setTokenEmployee = useAuth((s) => s.setToken);
  const router = useRouter();

  const setTokenUser = useCustomerAuth((s) => s.setToken);

  const qc = useQueryClient();

  const loginAdminMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginAdmin(email, password),
    onSuccess: async (token) => {
      setTokenEmployee(token);
      localStorage.setItem("is_admin_logged_in", "true");
      qc.invalidateQueries({ queryKey: ["employee-profile"] });

      router.push("/management/dashboard");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const loginCustomerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginCustomer(email, password),
    onSuccess: async (token) => {
      setTokenUser(token);
      localStorage.setItem("is_customer_logged_in", "true");
      qc.invalidateQueries({ queryKey: ["customer-profile"] });

      router.push("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerCustomer,
    onSuccess: () => {
      toast.success(
        "Register Customer Berhasil, Silahkan login untuk melanjutkan",
        { position: "top-center" },
      );
      router.push("/login");
    },
  });

  const logOutMutationAdmin = useMutation({
    mutationFn: async () => {
      return await logoutAdmin();
    },
    onSuccess: () => {
      qc.clear();
      localStorage.removeItem("is_admin_logged_in");
      router.push("/auth/management");
    },
  });

  return {
    loginAdminData: loginAdminMutation.mutate,
    isLoadingLoginAdmin: loginAdminMutation.isPending,
    loginCustomer: loginCustomerMutation.mutate,
    isLoadingLoginCustomer: loginCustomerMutation.isPending,

    registerCustomerData: registerMutation.mutate,
    signOutAdmin: logOutMutationAdmin.mutate,
  };
};
