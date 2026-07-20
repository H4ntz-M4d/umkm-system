"use client";

import { getAdminProfile } from "@/lib/queries/auth/auth.api";
import { useAuth } from "@/stores/useAuth";
import { useCustomerAuth } from "@/stores/userCustomerAuth";
import { useEffect, useState } from "react";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";

interface ManagementProviderProps {
  children: React.ReactNode;
}

export const ManagementProvider = ({ children }: ManagementProviderProps) => {
  const setUser = useAuth((s) => s.setUser);

  return children;
};
