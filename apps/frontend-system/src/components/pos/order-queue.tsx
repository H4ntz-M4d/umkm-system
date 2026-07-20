"use client";

import { Trash2, Badge, ListTodo } from "lucide-react";
import { toIDR } from "../../../utils/format-money";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { PosTransactionsParkedData, z } from "@repo/schemas";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { CartItem } from "./pos-view";
import { AdminUser } from "@/stores/useAuth";
import { ScrollArea } from "../ui/scroll-area";

type ItemCart = {
  price: string;
  qty: number;
};
type ParkedData = z.infer<typeof PosTransactionsParkedData>;

interface OrderQueueProps {
  parkedData: ParkedData[] | undefined;
  totalShopping: (items: ItemCart[]) => number;
  setTransPosId: (id: string | null) => void;
  transPosId: string | null;
  cart: CartItem[];
  parkedCart: (user: AdminUser | null, transaction: CartItem[]) => void;
  user: AdminUser | null;
  setCart: (cart: CartItem[]) => void;
}

export default function OrderQueue({
  parkedData,
  totalShopping,
  setTransPosId,
  transPosId,
  parkedCart,
  cart,
  setCart,
  user,
}: OrderQueueProps) {
  const { cancelPosTransactionData } = usePosTransactionOperations({});
  const getAllTransactionsIds = parkedData?.map((pd) => pd.transId) || [];
  const allTransactionsId = getAllTransactionsIds.filter((id) => id !== null);

  const resumeTransaction = (itemTrans: ParkedData) => {
    if (itemTrans.status !== "PARKED") return;
    if (cart.length > 0) {
      parkedCart(user, cart);
    }

    const cartItems = itemTrans.itemTransaction.map((it) => {
      return {
        name: it.itemTransactionName,
        price: it.price,
        productVariantId: it.productVariantId,
        qty: it.qty,
        variantOption: it.itemTransactionVariantOpt ?? "",
      };
    });

    setCart(cartItems);
    localStorage.setItem("pos_cart", JSON.stringify(cartItems));
  };

  return (
    <Card>
      <CardHeader className="px-0">
        <div className="flex justify-between items-center px-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl ">Antrian Order</h2>
            <p className="text-xs text-black/45 dark:text-white/60 mb-3">
              {parkedData?.length ?? 0} Order Menunggu
            </p>
          </div>
          <Button
            variant={"destructive"}
            type={"button"}
            onClick={() => cancelPosTransactionData(allTransactionsId)}
          >
            <Trash2 />
          </Button>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-5 px-0">
        <ScrollArea className="flex flex-col md:max-h-150 lg:max-h-120">
          {parkedData?.length ? (
            parkedData?.map((item, index) => (
              <div key={index} className="flex flex-col gap-5 p-2">
                <div className="flex flex-col gap-2 px-3">
                  <div className="flex flex-row justify-between min-w-0 gap-1">
                    <Badge className="text-xs">{item.transId}</Badge>
                    <p className="text-xs">22:14</p>
                  </div>
                  <div className="flex flex-row justify-between">
                    <div className="flex flex-col gap-1">
                      <p>Walk-in</p>
                      <p className="text-muted-foreground text-xs">
                        {item.itemTransaction.length} - Item
                      </p>
                    </div>
                    <div className="flex items-end">
                      <span>{toIDR(totalShopping(item.itemTransaction))}</span>
                    </div>
                  </div>
                  <div className={"flex flex-col gap-3 flex-1"}>
                    <Button
                      variant={"outline"}
                      size={"sm"}
                      className="text-xs border border-primary not-dark:text-primary dark:border dark:border-input bg-sidebar dark:bg-input/30 font-semibold font-stretch-50 hover:bg-accent hover:border-secondary"
                      type={"button"}
                      disabled={item.transId === transPosId}
                      onClick={() => {
                        resumeTransaction(item);
                        setTransPosId(item.transId);
                      }}
                    >
                      Lanjutkan Transaksi
                    </Button>
                    <Button
                      variant={"destructive"}
                      size={"sm"}
                      type={"button"}
                      onClick={() => cancelPosTransactionData([item.transId!])}
                    >
                      Batalkan Transaksi
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center flex-1 min-w-0 gap-2 text-muted-foreground/70 my-5">
              <ListTodo />
              <p className="text-sm font-medium truncate">
                List Antrian Transaksi
              </p>
              <p className="text-xs text-center">
                Masukkan ke antrian jika pelanggan masih ingin memilih produk
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
