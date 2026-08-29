"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UsersSchemaResponse, z } from "@repo/schemas";

/// Sebelumnya diketik `StoreData` -- sisa salin-tempel dari kolom toko yang
/// kebetulan lolos karena bentuknya mirip. Yang benar adalah data pengguna.
type UserRow = z.infer<typeof UsersSchemaResponse>;
import { Button } from "@/components/ui/button";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";

export const columnsCustomer = () //   setIdData: (id: string) => void,
//   deleteById: (id: string) => void
: ColumnDef<UserRow>[] => [
  {
    accessorKey: "id",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <p>
        {row.original.isActive ? (
          <Badge>Aktif</Badge>
        ) : (
          <Badge>Non Aktif</Badge>
        )}
      </p>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
    cell: ({ row }) => (
      <p>
        {dayjs(row.original.createdAt).locale("id").format("MMMM DD, YYYY")}
      </p>
    ),
  },
];
