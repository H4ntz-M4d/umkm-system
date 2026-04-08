import managementApi from "../../api/api.management";
import customerApi from "../../api/api.customer";
import { useCustomerAuth } from "./userCustomerAuth";
import { useAuth } from "./useAuth";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  CustomerRegisterInput,
  LoginResponse,
  UserProfileResponse,
  RegisterCustomerResponse,
} from "@repo/schemas";

export const loginAdmin = async (email: string, password: string) => {
  const response = await apiFetcher(
    managementApi.post("auth/management/login", {
      json: { email, password },
    }),
    LoginResponse,
  );

  return response.data.message;
};

export const getAdminProfile = async (token?: string) => {
  const response = await apiFetcher(
    managementApi.get("auth/management/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    UserProfileResponse,
  );
  return response.data;
};

export const loginCustomer = async (email: string, password: string) => {
  const response = await apiFetcher(
    customerApi.post("auth/customer/login", {
      json: { email, password },
    }),
    LoginResponse,
  );

  return response.data.message;
};

export const registerCustomer = async (payload: CustomerRegisterInput) => {
  const response = await apiFetcher(
    customerApi.post("auth/customer/register", {
      json: payload,
    }),
    RegisterCustomerResponse,
  );
  return response.data;
};

export const getCustomerProfile = async (token: string) => {
  const res = await apiFetcher(
    customerApi.get("auth/me/c", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
    UserProfileResponse,
  );
  return res.data;
};

export const logoutCustomer = async () => {
  useCustomerAuth.getState().logout();
  localStorage.removeItem("is_customer_logged_in");
  return customerApi.post("auth/logout").json<string>();
};

export const logoutAdmin = async () => {
  useAuth.getState().logout();
  localStorage.removeItem("is_admin_logged_in");
  return managementApi.post("auth/logout").json<string>();
};
