import z from "zod";
import {
  InventoryItemType,
  LedgerDirection,
  LedgerSource,
} from "./inventory-ledger.schema";
import { ApiSuccessResponse } from "../../api.schema.response";

const StockFlow = z.object({
  totalIn: z.number(),
  totalOut: z.number(),
});

const HistoryByType = z.object({
  productVariant: z.number(),
  rawMaterial: z.number(),
});

export const LedgerData = z.object({
  id: z.string(),
  name: z.string(),
  itemType: InventoryItemType,
  itemName: z.string(),
  direction: LedgerDirection,
  source: LedgerSource,
  quantity: z.number(),
  referenceId: z.string().optional(),
  createdAt: z.string(),
});

export const SummaryData = z.object({
  stockFlow: StockFlow,
  historyByType: HistoryByType,
})

export const SummaryResponse = ApiSuccessResponse(SummaryData)
export const InventoryLedgerResponse = ApiSuccessResponse(z.array(LedgerData));