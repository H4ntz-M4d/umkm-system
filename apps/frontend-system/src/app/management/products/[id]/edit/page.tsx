"use client"

import FormProduct from "@/components/management/products/form-input";
import { Toaster } from "sonner";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params.id as string;



  return (
    <>
      <FormProduct id={id} />
      <Toaster />
    </>
  );
}
