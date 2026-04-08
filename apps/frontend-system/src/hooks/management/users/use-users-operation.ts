import {
  createStaff,
  fetchUserById,
  fetchUsersCustomer,
  fetchUsersEmployee,
  removeStaff,
  updateStaff,
} from "@/lib/queries/users/users.query";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useUsersOperation({
  pagination,
  userId,
  search,
}: {
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  userId?: string | undefined | null;
  search?: string | undefined;
}) {
  const qc = useQueryClient();

  const isTableMode = !!pagination;
  const router = useRouter();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["employee"] });

  const getUsersEmployee = useQuery({
    queryKey: ["employee", pagination?.pageIndex, pagination?.pageSize, search],
    queryFn: () =>
      fetchUsersEmployee(pagination!.pageIndex, pagination!.pageSize, search),
    placeholderData: keepPreviousData,
    // INI KUNCINYA: Query hanya jalan jika isTableMode bernilai true
    enabled: isTableMode,
  });

  const getUsersCustomer = useQuery({
    queryKey: ["customer", pagination?.pageIndex, pagination?.pageSize, search],
    queryFn: () =>
      fetchUsersCustomer(pagination!.pageIndex, pagination!.pageSize, search),
    placeholderData: keepPreviousData,
    enabled: isTableMode,
  });

  const getUserById = useQuery({
    queryKey: ["employee", userId, "details"],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
  });

  const createAdminMutate = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      toast.success("Berhasil menyimpan data karyawan");
      setTimeout(() => {
        router.push("/management/employee");
      }, 800);
    },
    onError: (err) => {
      console.log("Error:",err);
    },
  });

  const updateStaffMutate = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateStaff(formData, id),
    onSuccess: () => {
      toast.success("Berhasil mengubah data karyawan");
      setTimeout(() => {
        router.push("/management/employee");
      }, 800);
    },
  });

  const deleteStaffMutate = useMutation({
    mutationFn: (userId: string) => removeStaff(userId),
    onSuccess: () => {
      invalidate();
      toast.success("Karyawan berhasil di hapus");
    },
  });

  return {
    dataEmployee: getUsersEmployee.data,
    isLoadingEmployee: getUsersEmployee.isLoading,

    dataCustomer: getUsersCustomer.data,
    isLoadingCustomer: getUsersCustomer.isLoading,

    getUserDataById: getUserById.data,

    createAdminData: createAdminMutate.mutate,
    isCreatingData: createAdminMutate.isPending,
    updateStaffData: updateStaffMutate.mutate,
    isUpdatingData: updateStaffMutate.isPending,
    deleteStaffData: deleteStaffMutate.mutate,
  };
}
