"use client";

import { getCustomerProfile } from "@/lib/queries/auth/auth.api";
import { useCustomerAuth } from "@/lib/queries/auth/userCustomerAuth";
import { useEffect, useState } from "react";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";
import { UserProfileResponse, z } from "@repo/schemas";

type UserProfile = z.infer<typeof UserProfileResponse>

interface CustomerProviderProps {
  children: React.ReactNode;
  user?: UserProfile;
}

export const CustomerProvider = ({ children, user }: CustomerProviderProps) => {
  const setUser = useCustomerAuth((s) => s.setUser);


  return children;
};
