import { z } from "@repo/schemas";

export async function apiFetcher<T extends z.ZodTypeAny>(
  request: Promise<Response>,
  schema: T,
): Promise<z.infer<T>> {
  const response = await request;
  const json: unknown = await response.json();
  return schema.parse(json);
}
