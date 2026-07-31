import ProfileView from "@/components/public/profile/profile-view";
import { Toaster } from "@/components/ui/sonner";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchAddresses } from "@/lib/queries/public/address.query";
import { redirect } from "next/navigation";

export default async function Pagie() {
  const token = await getCustomerToken();
  if (!token) redirect("/login");
  const addresses = await fetchAddresses(token).catch(() => null);

  return (
    <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-5xl">
      <ProfileView addresses={addresses?.data ?? []} />
      <Toaster />
    </main>
  );
}
