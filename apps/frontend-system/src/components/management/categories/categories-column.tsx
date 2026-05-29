"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CategoriesData, z } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CategoriesDataRes = z.infer<typeof CategoriesData>;

export const columnsCategories = (
  deleteById: (id: string) => void,
  setIdData: (id: string) => void,
  setIsOpen: (isOpen: boolean) => void,
): ColumnDef<CategoriesDataRes>[] => [
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
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "description",
    header: () => <p className="text-start">Deskripsi</p>,
    cell: ({ row }) => (
      <div className="text-start max-w-70">
        <p className="w-full truncate">{row.original.description}</p>
      </div>
    ),
  },
  {
    accessorKey: "productCount",
    header: "Produk",
  },
  {
    accessorKey: "status",
    header: "Status",
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
              setIsOpen(true);
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
