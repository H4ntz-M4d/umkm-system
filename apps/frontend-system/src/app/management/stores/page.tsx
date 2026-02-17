import { fetchStore } from "@/lib/stores/stores.query";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import StoreView from "./store-view";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    // q?: string
  }>
}

export default async function Page({searchParams}: PageProps) {
  const resolvedSearchParams = await searchParams;

  const queryClient = new QueryClient();
  
  const pageIndex = Number(resolvedSearchParams?.page || 1) - 1;
  const pageSize = Number(resolvedSearchParams?.limit || 10);

  await queryClient.prefetchQuery({
    queryKey: ["store", pageIndex, pageSize],
    queryFn: () => fetchStore(pageIndex, pageSize),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StoreView />
    </HydrationBoundary>
  )
}