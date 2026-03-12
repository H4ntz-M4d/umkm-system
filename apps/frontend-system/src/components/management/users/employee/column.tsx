"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StoreResponse } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const columnsEmployee = (
  // setIdData: (id: string) => void,
  deleteStaffData: (id: string) => void,
): ColumnDef<StoreResponse>[] => [
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
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const router = useRouter()
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={
              "outline"
            } 
            onClick={() => {
              router.push(`/management/employee/form-employee/${row.original.id.toString()}`)
            }}
          >
            Edit
          </Button>
          <Button
            variant={
              "destructive"
            } 
            onClick={() => deleteStaffData(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
