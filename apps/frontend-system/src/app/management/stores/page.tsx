import { fetchStore } from "@/lib/queries/stores/stores.query";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import View from "../../../components/management/stores/view";

// interface PageProps {
//   searchParams: Promise<{
//     page?: string;
//     limit?: string;
//     // q?: string
//   }>
// }

export default async function Page(/*{searchParams}: PageProps*/) {
  // const resolvedSearchParams = await searchParams;

  // const queryClient = new QueryClient();
  
  // const pageIndex = Number(resolvedSearchParams?.page || 1) - 1;
  // const pageSize = Number(resolvedSearchParams?.limit || 10);

  // await queryClient.prefetchQuery({
  //   queryKey: ["store", pageIndex, pageSize],
  //   queryFn: () => fetchStore(pageIndex, pageSize),
  // });

  return (
    // <HydrationBoundary state={dehydrate(queryClient)}>
      <View />
    // </HydrationBoundary>
  )
}