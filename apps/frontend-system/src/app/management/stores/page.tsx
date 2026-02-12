"use client"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { InputGroupInlineStart } from "@/components/ui/search"
import { Button } from "@/components/ui/button"
import { DataTableStore } from "./data-table"
import { columnsStore } from "./columns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore, fetchStore } from "@/lib/stores/stores.query"
import StoreForm from "@/components/management/stores/store-form"
import { useRouter } from "next/navigation"

export default function Page() {
    const { data, isLoading } = useQuery({
        queryKey: ['store'],
        queryFn: fetchStore
    })

    const router = useRouter()
    const qc = useQueryClient()

    const mutation = useMutation({
        mutationFn: createStore,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['store'] });
        },
        onError: (error) => {
            console.error("Gagal simpan:", error)
        }
    })
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#" className="font-bold text-xl">
                                    Stores
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>List Store</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
                    <InputGroupInlineStart />
                    <StoreForm onSubmit={(data) => mutation.mutate(data)} />
                </div>
                <div className="bg-muted/50 rounded-xl md:min-h-min">
                    <DataTableStore data={data ?? []} columns={columnsStore} />
                </div>
            </div>
        </>
    )
}
