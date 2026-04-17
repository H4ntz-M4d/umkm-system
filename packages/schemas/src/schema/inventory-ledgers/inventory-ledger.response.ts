import z from "zod";
import {
  InventoryItemType,
  LedgerDirection,
  LedgerSource,
} from "./inventory-ledger.schema";
import { ApiSuccessResponse } from "../../api.schema.response";

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

export const InventoryLedgerResponse = ApiSuccessResponse(z.array(LedgerData));