"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PaymentChannelEnum, PaymentResponseData, z } from "@repo/schemas";
import { Button } from "@/components/ui/button";

type PaymentChannel = z.infer<typeof PaymentChannelEnum>;
const channelMap: Record<PaymentChannel, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  MIDTRANS: "QRIS",
};

export const columnsPaymentMethod = (
  deleteById: (id: string) => void,
  setIdData: (id: string) => void,
): ColumnDef<PaymentResponseData>[] => [
  {
    id: "id",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "channel",
    header: "Metode Pembayaran",
    cell: ({ row }) => {
      const channelData = row.original.channel;
      const channel = channelMap[channelData as PaymentChannel];

      return <span>{channel}</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (row.original.isActive === true ? "Aktif" : "Nonaktif"),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            onClick={() => {
              setIdData(row.original.id.toString());
            }}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => deleteById(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
