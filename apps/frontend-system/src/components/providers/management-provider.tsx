"use client";

import { getAdminProfile } from "@/lib/auth/auth.api";
import { useAuth } from "@/lib/auth/useAuth";
import { useCustomerAuth } from "@/lib/auth/userCustomerAuth";
import { useEffect, useState } from "react";

interface ManagementProviderProps {
  children: React.ReactNode;
}

export const ManagementProvider = ({ children }: ManagementProviderProps) => {
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    const loadProfile = async () => {
      const isLoggedIn = localStorage.getItem('is_admin_logged_in')

      if (!isLoggedIn) {
        setUser(null)
        return
      }

      try {
        const profile = await getAdminProfile();
        setUser(profile);

        console.log('profile:', profile)
      } catch {
        setUser(null)
      }
    };

    loadProfile();
  }, [setUser]);

  return children;
};
