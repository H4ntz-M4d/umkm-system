"use client";

import DialogProductCard from "@/components/pos/dialog-product-card";
import PosFiltersComponent from "@/components/pos/pos-filters";
import ProductCard from "@/components/pos/products-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import {
  BadgeDollarSign,
  CreditCard,
  ListStart,
  ListTodo,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  PosTransactionSchemaInput,
  PosTransactionsParkedData,
  ProductListData,
  z,
} from "@repo/schemas";
import { AdminUser, useAuth } from "@/lib/queries/auth/useAuth";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { CameraScannerDialog } from "@/components/pos/camera-dialog";
import { toast } from "sonner";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Toaster } from "@/components/ui/sonner";
import { toIDR } from "../../../utils/format-money";
import { beepError, beepSuccess } from "../../../utils/beep";
import PosPaymentDialog from "./pos-payment-dialog";

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
  const { fetchPosProductListData } = useProductsOperation({
    enabledPosProductLists: true,
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
  };

  const confirmPickVariant = () => {
    if (!pickerProduct || !pickerVariantId) return;
    const v = pickerProduct.variants.find((pv) => pv.id === pickerVariantId);
    if (!v) return;
    addToCart(pickerProduct, v);
    setPickerProduct(null);
    setPickerVariantId(null);
  };

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

  const {
    mutationPosTransactionData,
    fetchPosTransactionsParkedData,
    cancelPosTransactionData,
  } = usePosTransactionOperations({ isParked: true });

  const parkedData = fetchPosTransactionsParkedData?.data;
  const getAllTransactionsIds = parkedData?.map((pd) => pd.transId) || [];
  const allTransactionsId = getAllTransactionsIds.filter((id) => id !== null);
  const [openPayment, setOpenPayment] = useState(false);

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

  type PosTransactionParked = z.infer<typeof PosTransactionsParkedData>;
  const resumeTransaction = (itemTrans: PosTransactionParked) => {
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
        <div className="py-6 px-10">
          <div className="grid md:grid-cols-12 gap-4 mb-6 h-[calc(100vh-80px)] overflow-hidden">
            <div className="md:col-span-8 flex flex-col space-y-5 overflow-y-auto no-scrollbar">
              <PosFiltersComponent setCameraOpen={setCameraOpen} />

              {/* List Produk */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            <div className="md:col-span-4 space-y-4 overflow-y-auto sticky top-0 h-full">
              {/* Proses Order */}
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
                            <p className="text-sm font-medium truncate">
                              {item.name}
                            </p>
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
                      <p className="text-primary">
                        {toIDR(totalShopping(cart))}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      disabled={!!transPosId || cart.length === 0}
                      onClick={() => setOpenPayment(true)}
                    >
                      <CreditCard />
                      <p>Bayar</p>
                    </Button>
                    <Button
                      variant={"outline"}
                      type={"button"}
                      disabled={!!transPosId || cart.length === 0}
                      onClick={() => parkedCart(user, cart)}
                    >
                      <ListStart />
                      <p>Masukkan Antrian</p>
                    </Button>
                  </div>

                  <p className="text-center text-xs">
                    Masukkan ke antrian jika pelanggan masih ingin memilih
                    produk
                  </p>
                </CardContent>
              </Card>

              {/* Antrian Order*/}
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
                      onClick={() =>
                        cancelPosTransactionData(allTransactionsId)
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <Separator />
                </CardHeader>
                <CardContent className="space-y-5 px-0">
                  <div className="flex flex-col">
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
                                <span>
                                  {toIDR(totalShopping(item.itemTransaction))}
                                </span>
                              </div>
                            </div>
                            <div className={"grid grid-cols-2 gap-3 flex-1"}>
                              <Button
                                variant={"outline"}
                                size={"sm"}
                                className="text-xs border border-primary not-dark:text-primary dark:border dark:border-input bg-sidebar dark:bg-input/30 font-semibold font-stretch-50 hover:bg-accent hover:border-secondary"
                                type={"button"}
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
                                onClick={() =>
                                  cancelPosTransactionData([item.transId!])
                                }
                              >
                                Batalkan Transaksi
                              </Button>
                            </div>
                          </div>
                          <Separator />
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col justify-center items-center flex-1 min-w-0 gap-2 text-muted-foreground/60 my-5">
                        <ListTodo />
                        <p className="text-sm font-medium truncate">
                          List Antrian Transaksi
                        </p>
                        <p className="text-xs">
                          Masukkan ke antrian jika pelanggan masih ingin memilih
                          produk
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
        />
        <Toaster />
      </div>
    </>
  );
}
