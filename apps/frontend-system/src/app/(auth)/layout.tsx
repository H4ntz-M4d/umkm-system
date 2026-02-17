import { Header } from "@/components/management/header";
import { AppSidebar } from "@/components/management/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <>
            {children}
        </>
    )
}