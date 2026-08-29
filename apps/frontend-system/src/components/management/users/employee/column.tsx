"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UsersSchemaResponse, z } from "@repo/schemas";

/// Sebelumnya diketik `StoreData` -- sisa salin-tempel dari kolom toko yang
/// kebetulan lolos karena bentuknya mirip. Yang benar adalah data pengguna.
type UserRow = z.infer<typeof UsersSchemaResponse>;
import { Button } from "@/components/ui/button";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";

export const columnsEmployee = (
  deleteStaffData: (id: string) => void,
  router: AppRouterInstance,
): ColumnDef<UserRow>[] => [
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
    accessorKey: "phone",
    header: "No. Handphone",
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
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            onClick={() => {
              router.push(
                `/management/employee/${row.original.id.toString()}/edit`,
              );
            }}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => deleteStaffData(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
