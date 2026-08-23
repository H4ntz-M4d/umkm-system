import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateStockTransferInput,
  StockTransferListResponse,
  StockTransferSingleResponse,
  TransferStatusType,
} from "@repo/schemas";

export interface StockTransferFilters {
  skip?: number;
  limit?: number;
  search?: string;
  status?: TransferStatusType | "";
  toStoreId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchStockTransfers = async (filters: StockTransferFilters) => {
  const clean = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
  const query = new URLSearchParams(clean as Record<string, string>).toString();

  return await apiFetcher(
    managementApi.get(`v1/stock-transfers?${query}`),
    StockTransferListResponse,
  );
};

export const createStockTransfer = async (data: CreateStockTransferInput) =>
  await apiFetcher(
    managementApi.post("v1/stock-transfers", { json: data }),
    StockTransferSingleResponse,
  );

/// Ketiganya memakai PATCH tanpa body: perpindahan status ditentukan server
/// dari keadaan kiriman, bukan dari apa yang dikirim client.
export const sendStockTransfer = async (id: string) =>
  await apiFetcher(
    managementApi.patch(`v1/stock-transfers/${id}/send`),
    StockTransferSingleResponse,
  );

export const receiveStockTransfer = async (id: string) =>
  await apiFetcher(
    managementApi.patch(`v1/stock-transfers/${id}/receive`),
    StockTransferSingleResponse,
  );

export const cancelStockTransfer = async (id: string) =>
  await apiFetcher(
    managementApi.patch(`v1/stock-transfers/${id}/cancel`),
    StockTransferSingleResponse,
  );
