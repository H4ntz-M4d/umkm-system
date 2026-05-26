"use client";

import DialogProductCard from "@/components/pos/dialog-product-card";
import ProductCard from "@/components/pos/products-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { Product, products } from "@/lib/queries/data/products";
import { fetchPosProductList } from "@/lib/queries/products/products.query";
import {
  CreditCard,
  ListStart,
  Minus,
  Plus,
  SearchIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export default function PosPage() {
  const productsData: Product = [...products];
  const { fetchPosProductListData } = useProductsOperation({});
  const dataProduct = fetchPosProductListData?.data;
  const [idPm, setIdPm] = useState<string | null>(null); // pm => product master

  const handleProductClick = () => {};
  const detailProduct = dataProduct?.find((product) => product.id === idPm);

  return (
    <>
      <div className="bg-sidebar min-h-screen">
        <div className="py-6 px-10">
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-8 space-y-5">
              <InputGroup className="bg-card">
                <InputGroupInput
                  id="inline-start-input"
                  placeholder="Search..."
                />
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
              <Tabs defaultValue="semua">
                <TabsList className="bg-card rounded-md w-full justify-start h-auto lg:h-10 gap-1 p-1">
                  <TabsTrigger
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
                    value="semua"
                  >
                    Semua
                  </TabsTrigger>
                  <TabsTrigger
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
                    value="topi"
                  >
                    Topi
                  </TabsTrigger>
                  <TabsTrigger
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
                    value="tas"
                  >
                    Tas
                  </TabsTrigger>
                  <TabsTrigger
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
                    value="gantungan_kunci"
                  >
                    Gantungan Kunci
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* List Produk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {dataProduct?.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    handleProductClick={handleProductClick}
                    setIdPm={setIdPm}
                  />
                ))}
              </div>
            </div>
            <div className="col-span-4 space-y-4">
              {/* Proses Order */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl ">Proses Order</h2>
                      <p className="text-xs text-black/45 dark:text-white/60 mb-3">
                        0 Item - Order baru
                      </p>
                    </div>
                    <Button variant={"destructive"}>
                      <Trash2 />
                    </Button>
                  </div>
                  <Separator />
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="flex gap-2 items-center rounded-xl border bg-sidebar p-2"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Sweater Rajut
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Beige Rp 150.000
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant={"outline"} size={"icon"}>
                            <Minus />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            1
                          </span>
                          <Button variant={"outline"} size={"icon"}>
                            <Plus />
                          </Button>
                        </div>
                        <Button
                          variant={"ghost"}
                          size={"icon-sm"}
                          className="hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <hr className="w-full border-dashed"></hr>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <p>Sub Total</p>
                        <p>Rp 983.000</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p>PPN 11%</p>
                        <p>Rp 983.000</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <p>Total</p>
                      <p className="text-primary">Rp 983.000</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button>
                      <CreditCard />
                      <p>Bayar</p>
                    </Button>
                    <Button variant={"outline"}>
                      <ListStart />
                      <p>Masukkan Antrian</p>
                    </Button>
                  </div>

                  <p className="text-center text-xs">
                    Masukkan ke antrian jika pelanggan masih ingin memilih item
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
                        3 Order Menunggu
                      </p>
                    </div>
                    <Button variant={"destructive"}>
                      <Trash2 />
                    </Button>
                  </div>
                  <Separator />
                </CardHeader>
                <CardContent className="space-y-5 px-0">
                  <div className="flex flex-col">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex flex-col gap-5 p-2">
                        <div className="flex flex-col gap-2 px-3">
                          <div className="flex flex-row justify-between min-w-0 gap-1">
                            <Badge className="text-xs">TRX-20260518-2304</Badge>
                            <p className="text-xs">22:14</p>
                          </div>
                          <div className="flex flex-row justify-between">
                            <div className="flex flex-col gap-1">
                              <p>Walk-in</p>
                              <p className="text-muted-foreground text-xs">
                                2 - Item
                              </p>
                            </div>
                            <div className="flex items-end">
                              <span>Rp 983.000</span>
                            </div>
                          </div>
                          <Button
                            variant={"outline"}
                            size={"sm"}
                            className="text-xs border border-primary not-dark:text-primary dark:border dark:border-input bg-sidebar dark:bg-input/30 font-semibold font-stretch-50 hover:bg-accent"
                          >
                            Lanjutkan Transaksi
                          </Button>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {detailProduct?.variants?.length > 1 && (
            <DialogProductCard
              product={detailProduct}
              open={!!idPm}
              setIdPm={setIdPm}
            />
          )}
        </div>
      </div>
    </>
  );
}
