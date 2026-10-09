"use client";

import { AdminUser, useAuth } from "@/stores/useAuth";
import { useEffect } from "react";

interface ManagementProviderProps {
  /// Profil diambil di layout (Server Component) yang memang memegang token,
  /// lalu diturunkan ke sini.
  user: AdminUser | null;
  children: React.ReactNode;
}

/**
 * Menaruh profil admin ke store supaya layar manajemen tahu siapa yang sedang
 * login — mis. dialog nego yang memilih dirinya sendiri sebagai pemroses.
 *
 * Sebelumnya komponen ini mengambil `setUser` lalu tidak pernah memakainya,
 * sehingga `useAuth().user` selalu kosong di seluruh sisi manajemen (hanya
 * POS yang mengisinya lewat PosProvider).
 */
export const ManagementProvider = ({
  user,
  children,
}: ManagementProviderProps) => {
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  return <>{children}</>;
};
