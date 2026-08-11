/**
 * Membaca klaim `role` dari JWT tanpa memverifikasi tanda tangannya — cukup
 * untuk memutuskan menu dan halaman apa yang ditampilkan. Keputusan yang
 * sebenarnya mengikat tetap dijaga `@Roles()` di controller NestJS, yang
 * memverifikasi token sungguhan, jadi payload palsu tidak akan lolos ke data.
 *
 * Access token dan refresh token ditandatangani dari payload yang sama, jadi
 * rolenya bisa diambil dari salah satunya.
 *
 * Dipakai bersama oleh `src/proxy.ts` (edge runtime) dan
 * `app/management/layout.tsx` (Node), karena itu sengaja memakai `atob` yang
 * tersedia di keduanya — bukan `Buffer`.
 */
export function getRoleFromToken(token?: string): string | undefined {
  if (!token) return undefined;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return undefined;

    // JWT memakai base64url, sementara atob menuntut base64 biasa.
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const { role } = JSON.parse(atob(padded)) as { role?: string };
    return role;
  } catch {
    return undefined;
  }
}
