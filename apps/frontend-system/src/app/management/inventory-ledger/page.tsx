import LedgerView from "@/components/management/inventory-ledger/view/view";
import { fetchInventoryLedger, getSummary } from "@/lib/queries/inventory-ledgers/inventory-ledgers.query";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function Page() {
  const queryClient = new QueryClient();
  const initialFilters = {}

  await Promise.all([
    queryClient.prefetchQuery({
        queryKey: ["inventory-ledgers-summary"],
        queryFn: () => getSummary(),
    }),
    queryClient.prefetchQuery({
        queryKey: ["inventory-ledgers", initialFilters],
        queryFn: () => fetchInventoryLedger(initialFilters),
    }),
  ])
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LedgerView />
    </HydrationBoundary>
  );
}
