import {
  getCustomerProfile,
  loginAdmin,
  loginCustomer,
  logoutAdmin,
  registerCustomer,
} from "@/lib/auth/auth.api";
import { useAuth } from "@/lib/auth/useAuth";
import { useCustomerAuth } from "@/lib/auth/userCustomerAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuthOperations = () => {
  const setToken = useAuth((s) => s.setToken);
  const router = useRouter();

  const setUser = useCustomerAuth((s) => s.setUser);
  const setTokenUser = useCustomerAuth((s) => s.setToken)
  const token = useCustomerAuth((s) => s.accessToken)

  const qc = useQueryClient();

  const loginAdminMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginAdmin(email, password),
    onSuccess: (token) => {

      setToken(token);
      router.push("/management/dashboard");
    },
  });

  const loginCustomerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginCustomer(email, password),
    onSuccess: async (token) => {

      setTokenUser(token);
      localStorage.setItem('is_customer_logged_in', 'true');

      const profile = await getCustomerProfile();
      setUser(profile);
      router.push("/")
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerCustomer,
    onSuccess: () => {
      toast.success("Register Customer Berhasil")
      router.push("/login")
    }
  })

  const profileQuery = useQuery({
    queryKey: ["customer-profile"],
    queryFn: getCustomerProfile,
    retry: false,
    enabled: false, // manual trigger
  });

  const logOutMutationAdmin = useMutation({
    mutationFn: async () => {
        return await logoutAdmin()
    },
    onSuccess: () => {
        qc.clear()
        localStorage.removeItem('is_admin_logged_in')  
        router.push('/auth/management')
    }
  })

  return {
    loginAdminData: loginAdminMutation.mutate,
    loginCustomer: loginCustomerMutation.mutate,
    registerCustomerData: registerMutation.mutate,
    profileQuery,
    signOutAdmin : logOutMutationAdmin.mutate
  };
};
