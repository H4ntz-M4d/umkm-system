import { loginAdmin } from "@/lib/auth/auth.api";
import { useAuth } from "@/lib/auth/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useAuthOperations = () => {
  const setToken = useAuth((s) => s.setToken);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginAdmin(email, password),
    onSuccess: (token) => {
      console.log(token);
      setToken(token);
      router.push("/management/dashboard");
    },
  });

  return {
    loginAdminData: loginMutation.mutate
  }
};
