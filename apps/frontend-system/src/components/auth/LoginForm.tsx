"use client";

import { Eye, EyeOff, Lock, Mail, ShoppingBag } from "lucide-react";
import {
  Control,
  Controller,
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
} from "react-hook-form";
import { LoginSchema, z } from "@repo/schemas";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type LoginData = z.infer<typeof LoginSchema>

interface LoginFormProps {
  control: Control<LoginData>;
  handleSubmit: UseFormHandleSubmit<LoginData>;
  errors: FieldErrors<LoginData>;
  loginMutate: SubmitHandler<LoginData>;
  isLoading: boolean;
}

export const LoginForm = ({
  control,
  handleSubmit,
  errors,
  loginMutate,
  isLoading
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit(loginMutate)} className="space-y-5">
      <div className="space-y-1.5">
        <FieldGroup>
          <Controller
            name={"email"}
            control={control}
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
                <FieldError>{errors.email?.message}</FieldError>
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <div className="space-y-1.5 text-end">
        <FieldGroup>
          <Controller
            name={"password"}
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Password</FieldLabel>
                <InputGroup className={"h-12"}>
                  <InputGroupInput
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    className={"rounded-e-md h-10"}
                  />
                  <InputGroupAddon align={"inline-start"}>
                    <Lock className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupAddon align={"inline-end"}>
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      variant={"link"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.password?.message as string}</FieldError>
              </Field>
            )}
          />
        </FieldGroup>
        <Button variant={"link"} size={"xs"}>
          Lupa Password?
        </Button>
      </div>

      <p className={"text-sm text-destructive font-body"}>
        {errors.root?.message}
      </p>

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
            <ShoppingBag className="h-4 w-4" />
            Masuk
          </>
        )}
      </button>
    </form>
  );
};
