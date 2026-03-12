import { logoutAdmin } from "@/lib/auth/auth.api";
import { fetchStoreList } from "@/lib/stores/stores.query";
import { createStaff, fetchUserById, fetchUsersCustomer, fetchUsersEmployee, removeStaff, updateStaff } from "@/lib/users/users.query";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function useUsersOperation({
  pagination,
  userId,
  search
}: {
  pagination?: {
    pageIndex: number;
    pageSize: number;
  }, 
  userId?: string | undefined | null,
  search?: string | undefined
}) {
  const qc = useQueryClient();

  const isTableMode = !!pagination

  const invalidate = () => qc.invalidateQueries({queryKey: ["employee"]})

  const getUsersEmployee = useQuery({
    queryKey: ["employee", pagination?.pageIndex, pagination?.pageSize, search],
    queryFn: () => fetchUsersEmployee(pagination!.pageIndex, pagination!.pageSize, search),
    placeholderData: keepPreviousData,
    // INI KUNCINYA: Query hanya jalan jika isTableMode bernilai true
    enabled: isTableMode
  });

  const getUsersCustomer = useQuery({
    queryKey: ["customer", pagination?.pageIndex, pagination?.pageSize],
    queryFn: () => fetchUsersCustomer(pagination!.pageIndex, pagination!.pageSize),
    placeholderData: keepPreviousData,
    enabled: isTableMode
  });

  const getStoreList = useQuery({
    queryKey: ["form-employee"],
    queryFn: () => fetchStoreList()
  })

  const getUserById = useQuery({
    queryKey: ["form-employee", userId],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
  })

  const createAdminMutate = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      invalidate()
      toast.success("Berhasil menyimpan data karyawan")
    }
  })

  const updateStaffMutate = useMutation({
    mutationFn: ({id, formData}: {id: string, formData: any}) => updateStaff(formData, id),
    onSuccess: () => {
      invalidate()
      toast.success("Berhasil mengubah data karyawan")
    }
  })

  const deleteStaffMutate = useMutation({
    mutationFn: (userId: string) => removeStaff(userId),
    onSuccess: () => {
      invalidate(),
      toast.success("Karyawan berhasil di hapus")
    }
  })
  
  return {
    dataEmployee: getUsersEmployee.data,
    isLoadingEmployee: getUsersEmployee.isLoading,

    dataCustomer: getUsersCustomer.data,
    isLoadingCustomer: getUsersCustomer.isLoading,

    dataStore: getStoreList.data,

    getUserDataById: getUserById.data,
    
    createAdminData: createAdminMutate.mutate,
    updateStaffData: updateStaffMutate.mutate,
    deleteStaffData: deleteStaffMutate.mutate,
  };
}
