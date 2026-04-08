"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import loginSideImage from "@/assets/login-side.jpg";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/queries/auth/useAuth";
import { LoginSchema, z } from "@repo/schemas";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/LoginForm";

type FormData = z.infer<typeof LoginSchema>;

export default function LoginManagementPage() {
  const { loginAdminData, isLoadingLoginAdmin } = useAuthOperations();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: FormData) => {
    loginAdminData(data, {
      onError: () => {
        setError("root", { message: "Email atau password tidak valid" });
        toast.error("Login Gagal", {
          description: "Email atau password tidak valid",
        });
      },
    });
  };

  return (
    <>
      <div className="flex min-h-screen">
        {/* Left - Hero Image */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src={loginSideImage.src}
            alt="Handmade knitted products"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-foreground/60 via-foreground/20 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
            <div className="animate-fade-in">
              <p className="text-primary-foreground/70 font-body text-sm tracking-widest uppercase mb-3">
                Management Information System
              </p>
              <h1 className="font-display text-4xl xl:text-5xl font-semibold text-primary-foreground leading-tight">
                Crafted with Care,
                <br />
                Managed with Precision
              </h1>
              <div className="mt-6 w-16 h-0.5 bg-primary rounded-full" />
            </div>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
          <div
            className="w-full max-w-md space-y-8 animate-fade-in"
            style={{ animationDelay: "0.15s", opacity: 1 }}
          >
            {/* Brand */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-lg">
                    N
                  </span>
                </div>
                <span className="font-display text-xl font-semibold text-foreground">
                  NurfaCraft
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                Selamat Datang
              </h2>
              <p className="mt-2 text-muted-foreground font-body">
                Masuk ke sistem manajemen untuk melanjutkan
              </p>
            </div>

            {/* Form */}
            <LoginForm
              control={control}
              handleSubmit={handleSubmit}
              errors={errors}
              loginMutate={onSubmit}
              isLoading={isLoadingLoginAdmin}
            />

            {/* Footer */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-body">
                <span>E-Commerce</span>
                <span className="text-accent">•</span>
                <span>Point of Sales</span>
                <span className="text-accent">•</span>
                <span>Inventory</span>
                <span className="text-accent">•</span>
                <span>Keuangan</span>
              </div>
              <p className="text-center text-xs text-muted-foreground/60 mt-3 font-body">
                © 2026 NurfaCraft MIS — Internal System
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
