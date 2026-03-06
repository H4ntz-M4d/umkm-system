import { create } from "zustand";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  accessToken: string | null;
  user: AdminUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));
