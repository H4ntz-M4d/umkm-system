"use client";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  ShoppingBag,
  Heart,
} from "lucide-react";
import customerHero from "@/assets/customer-hero.jpg";
import { useState } from "react";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { CustomerRegisterSchema, LoginSchema } from "@repo/schemas";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
import { Toaster } from "@/components/ui/sonner";

type FormDataLogin = z.infer<typeof LoginSchema>;
type FormDataRegister = z.infer<typeof CustomerRegisterSchema>;

export default function CustomerAuth() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginCustomer, registerCustomerData, isLoadingLoginCustomer } =
    useAuthOperations({});

  // Login state
  const {
    control: loginControl,
    handleSubmit: loginSubmit,
    formState: { errors: loginErrors },
  } = useForm<FormDataLogin>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const loginMutate = (data: FormDataLogin) => {
    loginCustomer(data);
  };

  // Register state
  const {
    control: registerControl,
    register: registerData,
    handleSubmit: registerSubmit,
    formState: { errors: registerErrors },
  } = useForm<FormDataRegister>({
    resolver: zodResolver(CustomerRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutate = (data: FormDataRegister) => {
    registerCustomerData(data);
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner with Hero */}
      <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden">
        <img
          src={customerHero.src}
          alt="KnitCraft handmade products collection"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-foreground/40 via-foreground/30 to-background" />
        <div className="relative flex flex-col items-center justify-center h-full text-center px-4">
          <div className="flex items-center gap-2.5 mb-3 animate-fade-in">
            <div className="w-11 h-11 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-display font-bold text-xl">
                N
              </span>
            </div>
            <span className="font-display text-2xl font-semibold text-primary-foreground drop-shadow-md">
              NurfaCraft
            </span>
          </div>
          <p
            className="text-primary-foreground/80 font-body text-sm tracking-wide animate-fade-in"
            style={{ animationDelay: "0.1s", opacity: 10 }}
          >
            Handmade with Love — Rajutan Premium Indonesia
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="flex justify-center px-4 md:-mt-20 pb-12">
        <div
          className="w-full max-w-md z-10 bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-fade-in"
          style={{ animationDelay: "0.2s", opacity: 100 }}
        >
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-4 text-sm font-body font-semibold transition-all relative ${
                activeTab === "login"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Masuk
              {activeTab === "login" && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-4 text-sm font-body font-semibold transition-all relative ${
                activeTab === "register"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daftar
              {activeTab === "register" && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === "login" ? (
              /* Login Form */
              <>
                <div className="text-center mb-6">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Selamat Datang Kembali
                  </h2>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Masuk untuk melihat pesanan & koleksi favorit Anda
                  </p>
                </div>
                <LoginForm
                  control={loginControl}
                  handleSubmit={loginSubmit}
                  errors={loginErrors}
                  loginMutate={loginMutate}
                  isLoading={isLoadingLoginCustomer}
                />
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground font-body">
                      atau
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground font-body font-medium text-sm hover:bg-secondary transition-all flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Masuk dengan Google
                </button>
              </>
            ) : (
              /* Register Form */
              <form
                onSubmit={registerSubmit(registerMutate)}
                className="space-y-4"
              >
                <div className="text-center mb-5">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Buat Akun Baru
                  </h2>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Bergabung untuk pengalaman belanja yang lebih personal
                  </p>
                </div>

                <div className="space-y-1.5">
                  <FieldGroup>
                    <Controller
                      name={"name"}
                      control={registerControl}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Nama Lengkap</FieldLabel>
                          <InputGroup className={"h-12"}>
                            <InputGroupInput
                              {...field}
                              type={"text"}
                              placeholder={"Masukkan nama lengkap"}
                              className={"rounded-e-md h-10"}
                            />
                            <InputGroupAddon>
                              <User className="h-4 w-4" />
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="space-y-1.5">
                  <FieldGroup>
                    <Controller
                      name={"email"}
                      control={registerControl}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Email</FieldLabel>
                          <InputGroup className={"h-12"}>
                            <InputGroupInput
                              {...field}
                              type={"text"}
                              placeholder={"email@contoh.com"}
                              className={"rounded-e-md h-10"}
                            />
                            <InputGroupAddon>
                              <Mail className="h-4 w-4" />
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="space-y-1.5">
                  <FieldGroup>
                    <Controller
                      name={"phone"}
                      control={registerControl}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>No. Handphone</FieldLabel>
                          <InputGroup className={"h-12"}>
                            <InputGroupInput
                              {...field}
                              type={"text"}
                              placeholder={"+62 812 3456 7890"}
                              className={"rounded-e-md h-10"}
                            />
                            <InputGroupAddon>
                              <Phone className="h-4 w-4" />
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="space-y-1.5">
                  <FieldGroup>
                    <Controller
                      name={"password"}
                      control={registerControl}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Password</FieldLabel>
                          <InputGroup className={"h-12"}>
                            <InputGroupInput
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder={"Masukkan password"}
                              className={"rounded-e-md h-10"}
                            />
                            <InputGroupAddon align={"inline-end"}>
                              <Button
                                type={"button"}
                                variant={"link"}
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="space-y-1.5">
                  <FieldGroup>
                    <Controller
                      name={"confirmPassword"}
                      control={registerControl}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Konfirmasi Password</FieldLabel>
                          <InputGroup className={"h-12"}>
                            <InputGroupInput
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder={"Masukkan kembali password"}
                              className={"rounded-e-md h-10"}
                            />
                            <InputGroupAddon align={"inline-end"}>
                              <Button
                                type={"button"}
                                variant={"link"}
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary accent-primary"
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground font-body leading-relaxed"
                  >
                    Saya setuju dengan{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                    >
                      Syarat & Ketentuan
                    </button>{" "}
                    dan{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                    >
                      Kebijakan Privasi
                    </button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Daftar Sekarang
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground font-body">
                © 2026 NurfaCraft — Rajutan Premium Handmade Indonesia
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
