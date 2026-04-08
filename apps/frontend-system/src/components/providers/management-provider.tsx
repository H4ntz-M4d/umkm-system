"use client";

import { getAdminProfile } from "@/lib/queries/auth/auth.api";
import { useAuth } from "@/lib/queries/auth/useAuth";
import { useCustomerAuth } from "@/lib/queries/auth/userCustomerAuth";
import { useEffect, useState } from "react";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";

interface ManagementProviderProps {
  children: React.ReactNode;
}

export const ManagementProvider = ({ children }: ManagementProviderProps) => {
  const setUser = useAuth((s) => s.setUser);

  return children;
};
