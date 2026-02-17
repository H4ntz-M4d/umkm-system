"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import loginSideImage from "@/assets/login-side.jpg";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth/useAuth";
import { LoginSchema, z } from "@repo/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";

type FormData = z.infer<typeof LoginSchema>;

export default function LoginManagementPage() {
  const { loginAdminData } = useAuthOperations();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(LoginSchema),
  });
  
  const onSubmit = (data: FormData) => {
    loginAdminData(data)
  }

  return (
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-body">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="nama@perusahaan.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all font-body text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground font-body">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-body font-medium"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all font-body text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground font-body"
              >
                Ingat saya di perangkat ini
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

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
  );
}
