"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsersOperation } from "@/hooks/management/users/use-users-operation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmployeeSchema,
  EmployeeSchemaInput,
  EmployeeUpdateSchema,
  EmployeeUpdateSchemaInput,
} from "@repo/schemas";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";

const role = [
  {
    id: "OWNER",
    title: "Owner",
    description: "Role untuk pemilik bisnis atau yang mewakili bisnis",
  },
  {
    id: "ADMIN",
    title: "Admin",
    description:
      "Role memiliki akses terhadap semua fitur yang ada dari sistem",
  },
  {
    id: "KASIR",
    title: "Kasir",
    description:
      "Digunakan untuk menangani sistem kasir (POS). Hanya bisa mengakses sistem kasir",
  },
  {
    id: "GUDANG",
    title: "Gudang",
    description:
      "Role memiliki akses terbatas pada barang, seperti: bahan baku, produk, produksi, inventori dan stok",
  },
];

const FormCreate = () => {
  const formData = EmployeeSchema;
  const { createAdminData } = useUsersOperation({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<EmployeeSchemaInput>({
    resolver: zodResolver(formData),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      phone: "",
      isActive: false,
      role: "ADMIN",
      password: "",
      confirmPassword: "",
      image: "",
      storeId: undefined,
    },
  });

  const onSubmit: SubmitHandler<EmployeeSchemaInput> = async (values) => {
    const data = new FormData();

    data.append("name", values.name);
    data.append("email", values.email);
    data.append("address", values.address);
    data.append("phone", values.phone ?? "");
    data.append("isActive", String(values.isActive));
    data.append("role", values.role);
    data.append("password", values.password);
    data.append("confirmPassword", values.confirmPassword);

    if (values.storeId) {
      data.append("storeId", String(values.storeId));
    }

    if (photoFile) {
      data.append("image", photoFile);
    }

    createAdminData(data);
  };

  return (
    <FormEmployeeUI
      form={form}
      onSubmit={onSubmit}
      setPhotoFile={setPhotoFile}
    />
  );
};

const FormUpdate = ({ id }: { id: string }) => {
  const formData = EmployeeUpdateSchema;
  const { updateStaffData } = useUsersOperation({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<EmployeeUpdateSchemaInput>({
    resolver: zodResolver(formData),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      phone: "",
      isActive: false,
      role: "ADMIN",
      image: "",
      storeId: undefined,
    },
  });

  const onSubmit: SubmitHandler<EmployeeUpdateSchemaInput> = async (values) => {
    const data = new FormData();

    data.append("name", values.name ?? "");
    data.append("email", values.email ?? "");
    data.append("address", values.address ?? "");
    data.append("phone", values.phone ?? "");
    data.append("isActive", String(values.isActive));
    data.append("role", values.role ?? "");

    if (values.password) {
      data.append("password", values.password ?? "");
      data.append("confirmPassword", values.confirmPassword ?? "");
    }

    if (values.storeId) {
      data.append("storeId", String(values.storeId));
    }

    if (photoFile) {
      data.append("image", photoFile);
    }

    updateStaffData({ id, formData: data });
  };

  return (
    <FormEmployeeUI
      id={id}
      form={form}
      onSubmit={onSubmit}
      setPhotoFile={setPhotoFile}
    />
  );
};

const FormEmployeeUI = ({
  id,
  form,
  onSubmit,
  setPhotoFile,
}: {
  id?: string;
  form: UseFormReturn<any>;
  onSubmit: SubmitHandler<any>;
  setPhotoFile: (file: File | null) => void;
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();

  const { dataStore, getUserDataById } = useUsersOperation({
    userId: id,
  });

  useEffect(() => {
    if (getUserDataById) {
      form.reset(getUserDataById?.data);
      setPhotoPreview(getUserDataById?.data?.image);
    } else {
      form.reset();
    }
  }, [getUserDataById]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex lg:flex-row flex-col gap-10">
        <div className="flex flex-col gap-8 lg:w-80 w-full items-center">
          <Card className="lg:w-80 w-full">
            <CardContent className="flex flex-col gap-5 items-center">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto Karyawan"
                    className=" w-40 h-40 rounded-md object-cover border"
                  />
                ) : (
                  <div className="w-40 h-40 bg-amber-100"></div>
                )}
                {photoPreview ? (
                  <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                    {/* Gunakan label agar area klik lebih mudah diatur, lalu sembunyikan input aslinya */}
                    <button
                      className="w-8 h-8 bg-amber-400 rounded-full cursor-pointer border-2 border-white shadow-sm hover:bg-amber-500 transition-colors "
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        form.setValue("image" as any, "");
                      }}
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <Controller
                    name="image"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                        {/* Gunakan label agar area klik lebih mudah diatur, lalu sembunyikan input aslinya */}
                        <label className="flex items-center justify-center w-8 h-8 bg-amber-400 rounded-full cursor-pointer border-2 border-white shadow-sm hover:bg-amber-500 transition-colors">
                          <input
                            type="file"
                            className="hidden" // Sembunyikan input asli yang kaku
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              const url = URL.createObjectURL(file);
                              setPhotoPreview(url);
                              setPhotoFile(file);
                            }}
                          />
                          {/* Kamu bisa menambahkan icon di sini, contoh (+) */}
                          <span className="text-white font-bold">+</span>
                        </label>
                      </div>
                    )}
                  />
                )}
              </div>
              <p className="w-60 text-center text-secondary text-xs">
                Gambar profile opsional untuk di tambahkan. hanya menerima file
                *.png, *.jpg dan *.jpeg
              </p>
            </CardContent>
          </Card>
          <Card className="lg:w-80 w-full">
            <CardContent>
              <FieldGroup>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "true")}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger className="w-full py-5">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Aktif</SelectItem>
                          <SelectItem value="false">Non Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  name="storeId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Toko dari Karyawan</FieldLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger className="w-full py-5">
                          <SelectValue placeholder="Pilih Toko" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataStore?.data?.map((store: any) => (
                            <SelectItem
                              key={store.id}
                              value={store.id.toString()}
                            >
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col w-full gap-8">
          <Card className="w-full">
            <CardContent>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Nama</FieldLabel>
                      <Input {...field} placeholder="Nama Karyawan?" />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@example.com"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Alamat</FieldLabel>
                      <InputGroup>
                        <InputGroupTextarea {...field} className="min-h-24" />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </InputGroup>
                    </Field>
                  )}
                />
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>No. Handphone</FieldLabel>
                      <Input {...field} type="number" />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Role Karyawan</FieldLabel>
                      <RadioGroup
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {role.map((roles) => (
                          <FieldLabel
                            key={roles.id}
                            htmlFor={`form-rhf-radiogroup-${roles.id}`}
                          >
                            <Field orientation="horizontal">
                              <RadioGroupItem
                                value={roles.id}
                                id={`form-rhf-radiogroup-${roles.id}`}
                                aria-invalid={fieldState.invalid}
                              />
                              <FieldContent>
                                <FieldTitle>{roles.title}</FieldTitle>
                                <FieldDescription className="text-sm">
                                  {roles.description}
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                          </FieldLabel>
                        ))}
                      </RadioGroup>
                    </Field>
                  )}
                />
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Password</FieldLabel>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Isi Password"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Konfirmasi Password</FieldLabel>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Ulangi password"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant={"outline"}
              onClick={() => router.back()}
            >
              Kembali
            </Button>
            <Button type={"submit"}>Simpan</Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default function FormEmployee({ id }: { id?: string }) {

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mb-20">
        <h1 className="font-bold text-xl font-body mt-5 text-foreground">
          Form Data Karyawan
        </h1>
        <p className="text-secondary">
          Formulir untuk mengisi data dari karyawan baru. Silahkan isi formulir
          berikut dengan data yang benar <br />
          dan klik simpan untuk menyimpan data
        </p>
        {id ? <FormUpdate id={id} /> : <FormCreate />}
      </div>
    </>
  );
}
