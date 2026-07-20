import { create } from "zustand";

type CustomerUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type CustomerAuthState = {
  accessToken: string | null;
  user: CustomerUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: CustomerUser | null) => void;
  logout: () => void;
};

export const useCustomerAuth = create<CustomerAuthState>((set) => ({
  accessToken: null,
  user: null,
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));
