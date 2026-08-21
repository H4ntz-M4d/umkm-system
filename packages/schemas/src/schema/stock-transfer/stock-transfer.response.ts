import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { TransferStatus } from "./stock-transfer.schema";

export const StockTransferItemData = z.object({
  productVariantId: z.string(),
  productName: z.string(),
  variantLabel: z.string(),
  sku: z.string(),
  quantity: z.number(),
});

export const StockTransferData = z.object({
  id: z.string(),
  code: z.string(),
  status: TransferStatus,
  fromStoreId: z.string(),
  fromStoreName: z.string(),
  toStoreId: z.string(),
  toStoreName: z.string(),
  /// Terisi bila kiriman ini lahir otomatis dari produksi yang selesai.
  productionId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  sentAt: z.string().nullable(),
  receivedAt: z.string().nullable(),
  /// Jumlah seluruh unit dalam kiriman — dipakai tabel supaya tidak perlu
  /// menjumlah item di sisi tampilan.
  totalQuantity: z.number(),
  items: z.array(StockTransferItemData),
});

export const StockTransferListResponse = ApiSuccessResponse(
  z.array(StockTransferData),
);

export const StockTransferSingleResponse =
  ApiSuccessResponse(StockTransferData);

export type StockTransferDataType = z.infer<typeof StockTransferData>;
export type StockTransferItemDataType = z.infer<typeof StockTransferItemData>;
