"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordSchema,
  NewPasswordFormSchema,
  VerifyResetCodeFormSchema,
  type ForgotPasswordInput,
  type NewPasswordFormInput,
  type VerifyResetCodeFormInput,
} from "@repo/schemas";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useForgotPassword } from "@/hooks/auth/use-forgot-password";

/// Judul & deskripsi tiap langkah, supaya kartu tahu apa yang harus ditampilkan
/// tanpa mengulang teks di tiga tempat berbeda.
const STEP_COPY: Record<string, { title: string; description: string }> = {
  email: {
    title: "Lupa Kata Sandi",
    description: "Masukkan email akun Anda untuk menerima kode verifikasi.",
  },
  code: {
    title: "Masukkan Kode Verifikasi",
    description: "Kode 6 digit berlaku selama 10 menit.",
  },
  password: {
    title: "Buat Kata Sandi Baru",
    description: "Gunakan kata sandi yang belum pernah dipakai sebelumnya.",
  },
  done: {
    title: "Kata Sandi Berhasil Diubah",
    description: "Silakan masuk kembali dengan kata sandi baru Anda.",
  },
};

function EmailStep({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (values: ForgotPasswordInput) => void;
}) {
  const { control, handleSubmit, formState } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FieldGroup>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Email</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  {...field}
                  type="email"
                  placeholder="email@contoh.com"
                  className="rounded-e-md h-10"
                  autoFocus
                />
                <InputGroupAddon>
                  <Mail className="h-4 w-4" />
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{formState.errors.email?.message}</FieldError>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={isBusy} className="w-full h-12">
        {isBusy ? "Mengirim..." : "Kirim Kode Verifikasi"}
      </Button>
    </form>
  );
}

function CodeStep({
  maskedEmail,
  isBusy,
  onSubmit,
  onBack,
}: {
  maskedEmail: string;
  isBusy: boolean;
  onSubmit: (values: VerifyResetCodeFormInput) => void;
  onBack: () => void;
}) {
  const { control, handleSubmit, formState } = useForm<VerifyResetCodeFormInput>({
    resolver: zodResolver(VerifyResetCodeFormSchema),
    defaultValues: { code: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-muted-foreground -mt-2">
        Kode dikirim ke <span className="font-medium text-foreground">{maskedEmail}</span>
      </p>

      <FieldGroup>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Kode Verifikasi</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  {...field}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="rounded-e-md h-10 text-center text-lg tracking-[0.5em]"
                  onChange={(event) =>
                    field.onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <InputGroupAddon>
                  <KeyRound className="h-4 w-4" />
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{formState.errors.code?.message}</FieldError>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={isBusy} className="w-full h-12">
        {isBusy ? "Memverifikasi..." : "Verifikasi Kode"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Salah email? Kirim ulang
      </button>
    </form>
  );
}

function PasswordStep({
  isBusy,
  onSubmit,
  onBack,
}: {
  isBusy: boolean;
  onSubmit: (values: NewPasswordFormInput) => void;
  onBack: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState } = useForm<NewPasswordFormInput>({
    resolver: zodResolver(NewPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FieldGroup>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Kata Sandi Baru</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  className="rounded-e-md h-10"
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{formState.errors.password?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Konfirmasi Kata Sandi</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru"
                  className="rounded-e-md h-10"
                />
              </InputGroup>
              <FieldError>{formState.errors.confirmPassword?.message}</FieldError>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" disabled={isBusy} className="w-full h-12">
        {isBusy ? "Menyimpan..." : "Ganti Kata Sandi"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Masukkan kode lain
      </button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  const {
    step,
    maskedEmail,
    isBusy,
    requestCode,
    confirmCode,
    submitNewPassword,
    goBack,
    goToLogin,
  } = useForgotPassword();

  const copy = STEP_COPY[step]!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                {step === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <KeyRound className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-foreground">
                  {copy.title}
                </h1>
                <p className="text-xs text-muted-foreground">{copy.description}</p>
              </div>
            </div>

            {step === "email" && (
              <EmailStep isBusy={isBusy} onSubmit={requestCode} />
            )}

            {step === "code" && (
              <CodeStep
                maskedEmail={maskedEmail}
                isBusy={isBusy}
                onSubmit={confirmCode}
                onBack={goBack}
              />
            )}

            {step === "password" && (
              <PasswordStep
                isBusy={isBusy}
                onSubmit={submitNewPassword}
                onBack={goBack}
              />
            )}

            {step === "done" && (
              <div className="space-y-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Kata sandi Anda sudah diperbarui. Sesi di perangkat lain juga
                  telah diputus demi keamanan.
                </p>
                <Button onClick={goToLogin} className="w-full h-12">
                  Ke Halaman Masuk
                </Button>
              </div>
            )}

            {step !== "done" && (
              <div className="mt-6 pt-4 border-t border-border text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={14} /> Kembali ke halaman masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
