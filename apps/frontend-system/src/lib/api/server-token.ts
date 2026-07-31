import { cookies, headers } from "next/headers";

/**
 * Token customer untuk dipakai Server Component.
 *
 * Dibaca dari header dulu, baru cookie: proxy.ts menyuntikkan
 * `x-access-token-customer` ketika ia baru saja me-refresh token, dan header itu
 * lebih baru daripada cookie yang masih dibawa request.
 */
export async function getCustomerToken() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return (
    headerStore.get("x-access-token-customer") ||
    cookieStore.get("access_token_customer")?.value
  );
}
