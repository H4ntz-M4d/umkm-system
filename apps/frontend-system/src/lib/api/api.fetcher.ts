import { ApiErrorResponse, z } from "@repo/schemas";
import { HTTPError } from "ky";

export async function apiFetcher<T extends z.ZodTypeAny>(
  request: Promise<Response>,
  schema: T,
): Promise<z.infer<T>> {
  try {
    const response = await request;
    const json: unknown = await response.json();
    return schema.parse(json);
  } catch (err) {
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
