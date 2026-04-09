"use client";

import { ColumnDef } from "@tanstack/react-table";
import NoImage from "@/assets/no-picture.jpg";
import Image from "next/image";
import { VariantData, z } from "@repo/schemas";

type ProductVariant = z.infer<typeof VariantData>;

export const columnsVariantProducts = () // setIdData: (id: string) => void,
// deleteStaffData: (id: string) => void,
: ColumnDef<ProductVariant>[] => [
  {
    accessorKey: "image",
    header: () => null,
    cell: ({ row }) => {
      const image = row.original.image ?? NoImage;
      return (
        <div>
          <Image
            width={500}
            height={500}
            className={"object-cover w-20 h-20 rounded-xl"}
            src={image}
            alt="Product image"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: () => null,
    cell: ({ row }) => {
      return (
        <div>
          <p className="font-body">{row.original.sku}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => null,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1 text-end">
          <p className="font-body font-bold">Harga</p>
          <p className="font-body text-secondary">{row.original.price}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "cost",
    header: () => null,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1 text-end">
          <p className="font-body font-bold">Biaya</p>
          <p className="font-body text-secondary">{row.original.cost}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "productVariantStocks",
    header: () => null,
    cell: ({ row }) => {
      const stock = row.original.productVariantStocks;

      return (
        <div className="flex flex-col gap-1 text-end">
          <p className="font-body font-bold">Stok Barang:</p>
          <p className="font-body text-secondary">
            {typeof stock === "number" ? stock : 0}
          </p>
        </div>
      );
    },
  },
  // {
  //   id: "actions",
  //   header: "Action",
  //   cell: ({ row }) => {
  //     const router = useRouter();
  //     return (
  //       <div className="flex gap-2 justify-center">
  //         <Button
  //           variant={"outline"}
  //           onClick={() => {
  //             router.push(
  //               ``,
  //             );
  //           }}
  //         >
  //           Edit
  //         </Button>
  //         <Button
  //           variant={"destructive"}
  //           onClick={() => deleteStaffData(row.original.id.toString())}
  //         >
  //           Delete
  //         </Button>
  //       </div>
  //     );
  //   },
  // },
];
