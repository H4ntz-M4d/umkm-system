'use client';

import FormEmployee from "@/components/management/users/employee/form-input";
import { useParams } from "next/navigation";
import { Toaster } from "sonner";

export default function Page() {
    const params = useParams()
    const idParams = params.id as string
    
  return (
    <>
      <FormEmployee id={idParams} />
      <Toaster />
    </>
  );
}
