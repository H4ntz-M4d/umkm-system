import { ApiErrorResponse, z } from "@repo/schemas";
import { HTTPError, TimeoutError } from "ky";

export async function apiFetcher<T extends z.ZodTypeAny>(
  request: Promise<Response>,
  schema: T,
): Promise<z.infer<T>> {
  try {
    const response = await request;
    const json: unknown = await response.json();
    return schema.parse(json);
  } catch (err) {
    /**
     * Permintaan yang menyerah duluan, bukan server yang menolak.
     *
     * Pesan bawaan ky ("Request timed out") tidak memberi tahu apa pun tentang
     * nasib datanya — padahal server bisa saja MENYELESAIKAN pekerjaannya
     * setelah browser berhenti menunggu (sering terjadi pada unggahan gambar).
     * Mengulang tanpa mengecek berisiko memproses dua kali.
     */
    if (err instanceof TimeoutError) {
      throw new Error(
        "Permintaan kelamaan dan dihentikan. Data mungkin tetap tersimpan di server — periksa dulu datanya sebelum mengulang.",
      );
    }

    if (err instanceof HTTPError) {
      const body = await err.response.json();
      const parsed = ApiErrorResponse.safeParse(body);
      throw new Error(
        parsed.success ? parsed.data.error.message : "Terjadi kesalahan.",
      );
    }
    throw err;
  }
}
