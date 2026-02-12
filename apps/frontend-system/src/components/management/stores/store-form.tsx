"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldContent, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { StoreInput, StoreSchema, z } from "@repo/schemas";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

type FormData = z.infer<typeof StoreSchema>

export default function StoreForm({ onSubmit }: { onSubmit: (v: FormData) => void }) {
    const form = useForm<FormData>({
        resolver: zodResolver(StoreSchema)
    })

    const [open ,setOpen] = useState(false)
    const handleSubmit = (data: FormData) => {
        onSubmit(data),
        setOpen(false),
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-30">Add Store</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <DialogHeader className="py-4">
                        <DialogTitle>Add Store</DialogTitle>
                        <DialogDescription>
                            Tambahkan nama toko lain disini. Kemudian klik save untuk menyimpan datanya
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="pt-1 pb-8">
                        <Field>
                            <FieldContent>
                                <Label>Nama</Label>
                                <Input {...form.register('name')} placeholder="Nama Toko" />
                            </FieldContent>
                            <FieldContent>
                                <Label>Status</Label>
                                <Controller
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(val) => field.onChange(val === "true")}
                                            value={field.value?.toString()}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">Aktif</SelectItem>
                                                <SelectItem value="false">Non Aktif</SelectItem>
                                            </SelectContent>

                                        </Select>
                                    )}
                                />
                            </FieldContent>

                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type={"submit"}>Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}