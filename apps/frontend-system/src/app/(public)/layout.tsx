import { CustomerProvider } from "@/components/providers/customer-provider";
import Header from "@/components/public/navigation/header";
import { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <CustomerProvider>
        <Header />
        {children}
      </CustomerProvider>
    </>
  );
}
