import { fetchExpense } from "@/lib/queries/expense/expense.query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useExpenseOperation = ({
  pagination,
  search,
}: {
  pagination?: {
    pageIndex?: number;
    pageSize?: number;
  };
  search?: string;
}) => {

  const fetchExpenseQuery = useQuery({
    queryKey: ["expense", pagination?.pageIndex, pagination?.pageSize, search],
    queryFn: () =>
      fetchExpense(pagination?.pageIndex, pagination?.pageSize, search),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  return {
    fetchExpenseData: fetchExpenseQuery.data,
  };
};
