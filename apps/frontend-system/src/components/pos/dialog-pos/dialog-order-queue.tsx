"use client";

import { AdminUser, useAuth } from "@/stores/useAuth";
import { PosTransactionsParkedData } from "@repo/schemas";
import z from "zod";
import { CartItem } from "../pos-view";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import OrderQueue from "../order-queue";
import { usePosUiStore } from "@/stores/pos-ui.store";
import { Button } from "@/components/ui/button";

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
  setCart: (cart: CartItem[]) => void;
}

export default function DialogOrderQueue({
  parkedData,
  totalShopping,
  setTransPosId,
  transPosId,
  parkedCart,
  cart,
  setCart,
}: OrderQueueProps) {
  const { isOrderQueueOpen, setOrderQueueOpen } = usePosUiStore();
  const user = useAuth((s) => s.user);
  return (
    <Dialog open={isOrderQueueOpen} onOpenChange={setOrderQueueOpen}>
      <DialogContent showCloseButton={false}>
        <VisuallyHidden.Root>
          <DialogTitle></DialogTitle>
        </VisuallyHidden.Root>

        <OrderQueue
          cart={cart}
          setCart={setCart}
          parkedCart={parkedCart}
          parkedData={parkedData}
          transPosId={transPosId}
          setTransPosId={setTransPosId}
          totalShopping={totalShopping}
          user={user}
        />

        <DialogFooter className="items-center">
          <DialogClose asChild>
            <Button variant={"outline"}>Tutup Modal</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
