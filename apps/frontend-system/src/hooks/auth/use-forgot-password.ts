"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "@/lib/queries/auth/auth.api";

type Step = "email" | "code" | "password" | "done";

export function useForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const requestCode = async (values: { email: string }) => {
    setIsBusy(true);
    try {
      const result = await forgotPassword(values.email);
      setEmail(values.email);
      setMaskedEmail(result.maskedEmail);
      setStep("code");
      toast.success(result.message);
    } catch (error) {
      toast.error("Gagal mengirim kode", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const confirmCode = async (values: { code: string }) => {
    setIsBusy(true);
    try {
      const result = await verifyResetCode(email, values.code);
      setCode(values.code);
      setStep("password");
      toast.success(result.message);
    } catch (error) {
      toast.error("Kode tidak valid", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const submitNewPassword = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    setIsBusy(true);
    try {
      // Kode masuk lagi di sini karena backend memeriksanya ulang di
      // langkah ini — bukan cuman mengandalkan hasil verifikasi sebelumnya.
      const result = await resetPassword({ email, code, ...values });
      setStep("done");
      toast.success(result.message);
    } catch (error) {
      toast.error("Gagal mengganti kata sandi", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  };

  // Kembali satu langkah tanpa mengulang dari awal, supaya email/kode yang
  // sudah benar tidak perlu diketik ulang.
  const goBack = () => {
    if (step === "code") setStep("email");
    if (step === "password") setStep("code");
  };

  const goToLogin = () => router.push("/login");

  return {
    step,
    email,
    maskedEmail,
    isBusy,
    requestCode,
    confirmCode,
    submitNewPassword,
    goBack,
    goToLogin,
  };
}
