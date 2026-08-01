import customerApi from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  SingleCustomerDataResponse,
  type CustomerProfileInput,
} from "@repo/schemas";

/**
 * Menyimpan profil customer.
 *
 * Dikirim sebagai FormData, bukan JSON, karena foto ikut serta dalam permintaan
 * yang sama — endpoint-nya memakai FileInterceptor. `image` hanya dilampirkan
 * bila pengguna benar-benar memilih berkas baru; tanpa itu foto lama dibiarkan.
 */
export const updateProfileCustomer = async (
  data: CustomerProfileInput,
  image?: File | null,
) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("phone", data.phone);
  if (image) formData.append("image", image);

  return apiFetcher(
    customerApi.post("v1/users/profile-customer", { body: formData }),
    SingleCustomerDataResponse,
  );
};
