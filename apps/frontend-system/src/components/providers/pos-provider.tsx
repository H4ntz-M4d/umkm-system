"use client"

import { AdminUser, useAuth } from "@/lib/queries/auth/useAuth";
import React, { useEffect } from "react";

interface PosProviderProps {
  user: AdminUser | null;
  children: React.ReactNode;
}

export default function PosProvider({ user, children }: PosProviderProps) {
  const setUser = useAuth((state) => state.setUser);

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  return <>{children}</>;
}
