import { Header } from "@/components/management/header";
import { AppSidebar } from "@/components/management/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

interface AdminLayoutProps {
    children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <Header />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </>
    )
}