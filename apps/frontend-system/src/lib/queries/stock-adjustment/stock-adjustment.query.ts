import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  StockAdjustmentInput,
  StockAdjustmentResultResponse,
  StockAdjustmentRowsResponse,
} from "@repo/schemas";

export const fetchAdjustmentRows = async (params: {
  storeId?: string | null;
  search?: string;
}) => {
  const query = new URLSearchParams(
    Object.entries({
      storeId: params.storeId ?? "",
      search: params.search ?? "",
    })
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  const res = await apiFetcher(
    managementApi.get(`v1/stock-adjustments/rows${query ? `?${query}` : ""}`),
    StockAdjustmentRowsResponse,
  );

  return res.data;
};

export const applyAdjustment = async (data: StockAdjustmentInput) => {
  const res = await apiFetcher(
    managementApi.post("v1/stock-adjustments", { json: data }),
    StockAdjustmentResultResponse,
  );

  return res.data;
};
