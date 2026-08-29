"use client";

import { useEffect } from "react";
import { useCustomerAuth } from "@/stores/userCustomerAuth";
import { UserProfileResponse, z } from "@repo/schemas";

/// Profil hasil apiFetcher sudah dibuka dari envelope-nya, jadi yang diterima
/// di sini adalah isi `data`, bukan seluruh response.
type CustomerProfile = z.infer<typeof UserProfileResponse>["data"];

interface CustomerProviderProps {
  children: React.ReactNode;
  user?: CustomerProfile;
}

/**
 * Menyalin profil hasil render server ke store client, supaya komponen dalam
 * yang tidak menerima prop `user` tetap tahu status login.
 */
export const CustomerProvider = ({ children, user }: CustomerProviderProps) => {
  const setUser = useCustomerAuth((s) => s.setUser);

  useEffect(() => {
    // UsersProfile adalah discriminated union: cabang admin tidak punya phone
    // maupun image, jadi keduanya hanya boleh dibaca setelah role dipastikan
    // CUSTOMER.
    if (!user || user.role !== "CUSTOMER") {
      setUser(null);
      return;
    }

    setUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      phone: user.phone,
    });
  }, [user, setUser]);

  return children;
};
