import managementApi from "../api.management";
import customerApi from "../api.customer";
import { useCustomerAuth } from "./userCustomerAuth";
import { useAuth } from "./useAuth";

export const loginAdmin = async (email: string, password: string) => {
  const response = await managementApi
    .post("auth/management/login", {
      json: { email, password },
    })
    .json<any>();

  return response.data.accessToken;
};

export const getAdminProfile = async () => {
  const response = await managementApi.get("auth/management/me").json<any>();
  return response;
};

export const loginCustomer = async (email: string, password: string) => {
  const response = await customerApi
    .post("auth/customer/login", {
      json: { email, password },
    })
    .json<any>();

  return response.data.accessToken;
};

export const registerCustomer = async (payload: any) => {
  const response = await customerApi
    .post("auth/customer/register", {
      json: payload,
    })
    .json<any>();

  return response;
};

export const getCustomerProfile = async () => {
  return customerApi.get("auth/me/c").json<any>();
};

export const logoutCustomer = async () => {
  useCustomerAuth.getState().logout();
  localStorage.removeItem('is_customer_logged_in')
  return customerApi.post("auth/logout").json<any>();
};

export const logoutAdmin = async () => {
  useAuth.getState().logout();
  localStorage.removeItem('is_admin_logged_in')
  return managementApi.post('auth/logout').json<any>();
}
