"use client"

import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import OrderProcess from "../order-process";
import { AdminUser, useAuth } from "@/stores/useAuth";
import { CartItem } from "../pos-view";
import { usePosUiStore } from "@/stores/pos-ui.store";
import { VisuallyHidden } from "radix-ui";
import { Button } from "@/components/ui/button";

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
  totalShopping: (items: ItemCart[]) => number;
}

export default function DialogOrderProcess({
  cart,
  clearCart,
  setCart,
  setOpenPayment,
  transPosId,
  existOnParked,
  parkedCart,
  totalShopping,
}: OrderProcessProps) {
  const user = useAuth((s) => s.user);
  const { isOrderProcessOpen, setOrderProcessOpen } = usePosUiStore();
  return (
    <Dialog open={isOrderProcessOpen} onOpenChange={setOrderProcessOpen}>
      <DialogContent showCloseButton={false}>
        <VisuallyHidden.Root>
            <DialogTitle></DialogTitle>
        </VisuallyHidden.Root>
        <OrderProcess
          cart={cart}
          clearCart={clearCart}
          setCart={setCart}
          setOpenPayment={setOpenPayment}
          transPosId={transPosId}
          existOnParked={existOnParked}
          parkedCart={parkedCart}
          totalShopping={totalShopping}
          user={user}
        />
        <DialogFooter className="items-center">
            <DialogClose asChild>
                <Button variant={"outline"} className="w-50">
                    Tutup Dialog
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
