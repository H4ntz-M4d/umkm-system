"use client";

import DialogProductCard from "@/components/pos/dialog-pos/dialog-product-card";
import PosFiltersComponent from "@/components/pos/pos-filters";
import ProductCard from "@/components/pos/products-card";
import { Button } from "@/components/ui/button";
import {
  PosFilters,
  useProductsOperation,
} from "@/hooks/management/products/use-products-operation";
import { useEffect, useState } from "react";
import { PosTransactionSchemaInput, ProductListData, z } from "@repo/schemas";
import { AdminUser, useAuth } from "@/stores/useAuth";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { CameraScannerDialog } from "@/components/pos/camera-dialog";
import { toast } from "sonner";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Toaster } from "@/components/ui/sonner";
import { beepError, beepSuccess } from "../../../utils/beep";
import PosPaymentDialog from "./dialog-pos/pos-payment-dialog";
import OrderProcess from "./order-process";
import OrderQueue from "./order-queue";
import DialogOrderProcess from "./dialog-pos/dialog-order-process";
import DialogOrderQueue from "./dialog-pos/dialog-order-queue";

export type ProductList = z.infer<typeof ProductListData>;

type Variant = {
  id: string;
  price: string;
  sku: string;
};

export type CartItem = {
  name: string;
  productVariantId: string;
  variantOption: string;
  price: string;
  qty: number;
};

export default function PosView() {
  const [filters, setFilters] = useState<PosFilters>({
    search: "",
    categoryId: "",
  });

  const { fetchPosProductListData } = useProductsOperation({
    enabledPosProductLists: true,
    posFilters: filters,
  });

  const [idPm, setIdPm] = useState<string | null>(null);
  const [pickerProduct, setPickerProduct] = useState<ProductList | null>(null);
  const [pickerVariantId, setPickerVariantId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("pos_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [transPosId, setTransPosId] = useState<string | null>(null);
  const [visibleProducts, setVisibleProducts] = useState(12);
  const productsList = fetchPosProductListData?.data || [];
  const displayProduct = productsList.slice(0, visibleProducts);
  const [cameraOpen, setCameraOpen] = useState(false);

  const user = useAuth((state) => state.user);

  useEffect(() => {
    localStorage.setItem("pos_cart", JSON.stringify(cart));
  }, [cart]);

  const detailProduct = productsList?.find((product) => product.id === idPm);

  const handleProductClick = (product: ProductList) => {
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else {
      setPickerProduct(product);
      setPickerVariantId(null);
    }
  };

  const addToCart = (product: ProductList, variant: Variant) => {
    const productVariant = product.variants.find((pv) => pv.id === variant.id);
    const varOpt = productVariant?.options
      ?.map((opt) => opt.variantValue.value)
      .join(" / ");
    const existing = cart.find((v) => v.productVariantId === variant.id);
    const updated = existing
      ? cart.map((i) =>
          i.productVariantId === variant.id ? { ...i, qty: i.qty + 1 } : i,
        )
      : [
          ...cart,
          {
            name: product.name,
            price: variant.price,
            productVariantId: variant.id,
            qty: 1,
            variantOption: varOpt ?? "",
          },
        ];

    setCart(updated);
    toast.success("+1 Product telah ditambahkan ke keranjang", {
      position: "top-center",
    });
  };

  const confirmPickVariant = () => {
    if (!pickerProduct || !pickerVariantId) return;
    const v = pickerProduct.variants.find((pv) => pv.id === pickerVariantId);
    if (!v) return;
    addToCart(pickerProduct, v);
    setPickerProduct(null);
    setPickerVariantId(null);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("pos_cart");
    setTransPosId(null);
  };

  type ItemCart = {
    price: string;
    qty: number;
  };

  const totalShopping = (items: ItemCart[]) => {
    const total = items.reduce((total, item) => {
      return total + Number(item.price) * item.qty;
    }, 0);
    return total;
  };

  const { mutationPosTransactionData, fetchPosTransactionsParkedData } =
    usePosTransactionOperations({ isParked: true });

  const parkedData = fetchPosTransactionsParkedData?.data;
  const [openPayment, setOpenPayment] = useState(false);
  const existOnParked = parkedData?.some((data) => data.transId === transPosId);

  const parkedCart = (cashier: AdminUser | null, transaction: CartItem[]) => {
    if (!cashier?.storeId) return;
    const payload: PosTransactionSchemaInput = {
      status: "PARKED",
      storeId: cashier.storeId,
      cashierId: cashier.id,
      transId: transPosId,
      paymentMethodId: null,
      itemTransaction: transaction.map((c) => {
        return {
          productVariantId: c.productVariantId,
          quantity: c.qty,
          price: Number(c.price),
        };
      }),
    };

    mutationPosTransactionData(payload);
    localStorage.removeItem("pos_cart");
    clearCart();
  };

  const findVariantBySku = (codeSku: string) => {
    const trimmed = codeSku.trim();
    for (const product of productsList) {
      const productVariant = product.variants.find((v) => v.sku === trimmed);
      if (productVariant) {
        return { product, productVariant };
      }
    }
  };

  const handleBarcodeScan = (codeSku: string) => {
    const match = findVariantBySku(codeSku);
    if (!match) {
      beepError();
      toast.error("Barcode tidak ditemukan", {
        position: "top-center",
        description: codeSku,
      });
      return;
    }
    addToCart(match.product, match.productVariant);
    beepSuccess();
    const varOpt = match.productVariant.options
      ?.map((v) => v.variantValue.value)
      .join(" - ");
    toast.success(`+1 ${match.product.name}`, {
      position: "top-center",
      description: `${varOpt}`,
    });
  };

  useBarcodeScanner(handleBarcodeScan);

  return (
    <>
      <div className="bg-sidebar min-h-screen">
        <div className="py-6 px-5 md:px-8">
          <div className="grid md:grid-cols-12 gap-4 mb-6">
            {/* left side */}
            <div className="lg:col-span-6 md:col-span-7 flex flex-col overflow-hidden space-y-5">
              <PosFiltersComponent
                setCameraOpen={setCameraOpen}
                onSearchChange={(val) => setFilters({ search: val })}
                onChangeCategory={(val) => setFilters({ categoryId: val })}
              />

              {/* List Produk */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayProduct?.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    handleProductClick={handleProductClick}
                    setIdPm={setIdPm}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant={"outline"}
                onClick={() => setVisibleProducts((prev) => prev + 12)}
              >
                Tampilkan lebih banyak
              </Button>
            </div>

            {/* right side */}
            <div className="hidden md:block lg:col-span-6 md:col-span-5 md:sticky md:top-10 h-fit">
              <div className="grid grid-cols-12 gap-3">
                {/* Proses Order */}
                <div className="hidden md:block md:col-span-12 lg:col-span-7">
                  <OrderProcess
                    cart={cart}
                    setCart={setCart}
                    clearCart={clearCart}
                    existOnParked={existOnParked}
                    parkedCart={parkedCart}
                    setOpenPayment={setOpenPayment}
                    transPosId={transPosId}
                    user={user}
                    totalShopping={totalShopping}
                  />
                </div>

                {/* Antrian Order*/}
                <div className="hidden lg:block lg:col-span-5">
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
                </div>
              </div>
            </div>
          </div>
        </div>
        <CameraScannerDialog
          open={cameraOpen}
          onOpenChange={setCameraOpen}
          onDetected={handleBarcodeScan}
        />
        <DialogProductCard
          product={detailProduct}
          open={!!pickerProduct}
          pickerVariantId={pickerVariantId}
          setPickerProduct={setPickerProduct}
          setPickerVariantId={setPickerVariantId}
          confirmPickVariant={confirmPickVariant}
        />
        <PosPaymentDialog
          openPayment={openPayment}
          setOpenPayment={setOpenPayment}
          clearCart={clearCart}
          cart={cart}
          totalShopping={totalShopping(cart)}
          transPosId={transPosId}
        />
        <DialogOrderProcess
          cart={cart}
          setCart={setCart}
          clearCart={clearCart}
          existOnParked={existOnParked}
          parkedCart={parkedCart}
          setOpenPayment={setOpenPayment}
          transPosId={transPosId}
          totalShopping={totalShopping}
        />

        <DialogOrderQueue
          cart={cart}
          setCart={setCart}
          parkedCart={parkedCart}
          parkedData={parkedData}
          transPosId={transPosId}
          setTransPosId={setTransPosId}
          totalShopping={totalShopping}
        />
        <Toaster />
      </div>
    </>
  );
}
