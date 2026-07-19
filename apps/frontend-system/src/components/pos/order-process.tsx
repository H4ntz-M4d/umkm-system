"use client";

import {
  BadgeDollarSign,
  CreditCard,
  ListStart,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Separator } from "../ui/separator";
import { CartItem } from "./pos-view";
import { toIDR } from "../../../utils/format-money";
import { AdminUser } from "@/lib/queries/auth/useAuth";

type ItemCart = {
  price: string;
  qty: number;
};

interface OrderProcessProps {
  cart: CartItem[];
  clearCart: () => void;
  setCart: (cart: CartItem[]) => void;
  setOpenPayment: (open: boolean) => void;
  transPosId: string | null;
  existOnParked: boolean | undefined;
  parkedCart: (user: AdminUser | null, transaction: CartItem[]) => void;
  user: AdminUser | null;
  totalShopping: (items: ItemCart[]) => number;
}

export default function OrderProcess({
  cart,
  clearCart,
  setCart,
  setOpenPayment,
  transPosId,
  existOnParked,
  parkedCart,
  user,
  totalShopping
}: OrderProcessProps) {
  const removeItem = (variantId: string) => {
    const updated = cart.filter((v) => v.productVariantId !== variantId);
    setCart(updated);
  };

  const updateQty = (variantId: string, qty: number) => {
    if (qty <= 0) return removeItem(variantId);
    const updated = cart.map((p) =>
      p.productVariantId === variantId ? { ...p, qty } : p,
    );
    setCart(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl ">Proses Order</h2>
            <p className="text-xs text-black/45 dark:text-white/60 mb-3">
              {cart.length ?? 0} Item - Order baru
            </p>
          </div>
          <Button
            variant={"destructive"}
            type={"button"}
            onClick={() => clearCart()}
          >
            <Trash2 />
          </Button>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2">
          {cart.length ? (
            cart.map((item, index) => (
              <div
                key={index}
                className="flex gap-2 items-center rounded-xl border bg-sidebar p-2"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.variantOption ?? ""} {toIDR(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    type={"button"}
                    onClick={() =>
                      updateQty(item.productVariantId, item.qty - 1)
                    }
                  >
                    <Minus />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.qty}
                  </span>
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    onClick={() =>
                      updateQty(item.productVariantId, item.qty + 1)
                    }
                    type={"button"}
                  >
                    <Plus />
                  </Button>
                </div>
                <Button
                  variant={"ghost"}
                  size={"icon-sm"}
                  className="hover:text-destructive"
                  type={"button"}
                  onClick={() => removeItem(item.productVariantId)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center flex-1 min-w-0 gap-2 text-muted-foreground/60 my-5">
              <BadgeDollarSign />
              <p className="text-sm font-medium truncate">
                Belum ada produk di pilih
              </p>
              <p className="text-xs">
                Pilih produk atau dari antian untuk melanjutkan
              </p>
            </div>
          )}
        </div>
        <hr className="w-full border-dashed"></hr>

        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center text-lg font-semibold">
            <p>Total Belanja:</p>
            <p className="text-primary">{toIDR(totalShopping(cart))}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <Button
            type="button"
            disabled={!transPosId && cart.length === 0}
            onClick={() => setOpenPayment(true)}
          >
            <CreditCard />
            <p>Bayar</p>
          </Button>
          <Button
            variant={"outline"}
            type={"button"}
            disabled={existOnParked || cart.length === 0}
            onClick={() => parkedCart(user, cart)}
          >
            <ListStart />
            <p>Masukkan Antrian</p>
          </Button>
        </div>

        <p className="text-center text-xs">
          Masukkan ke antrian jika pelanggan masih ingin memilih produk
        </p>
      </CardContent>
    </Card>
  );
}
