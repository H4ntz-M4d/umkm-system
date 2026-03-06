import { logoutAdmin } from "@/lib/auth/auth.api";
import { fetchUsersCustomer, fetchUsersEmployee } from "@/lib/users/users.query";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export function useUsersOperation(pagination: {
  pageIndex: number;
  pageSize: number;
}) {
  const qc = useQueryClient();

  const getUsersEmployee = useQuery({
    queryKey: ["employee", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchUsersEmployee(pagination.pageIndex, pagination.pageSize),
    placeholderData: keepPreviousData,
  });

  const getUsersCustomer = useQuery({
    queryKey: ["customer", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchUsersCustomer(pagination.pageIndex, pagination.pageSize),
    placeholderData: keepPreviousData,
  });
  
  return {
    dataEmployee: getUsersEmployee.data,
    isLoadingEmployee: getUsersEmployee.isLoading,

    dataCustomer: getUsersCustomer.data,
    isLoadingCustomer: getUsersCustomer.isLoading,
  };
}
