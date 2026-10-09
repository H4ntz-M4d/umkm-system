import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

/**
 * Gambar pratinjau bawaan saat tautan situs dibagikan.
 *
 * Dibuat dari kode, bukan berkas gambar, supaya tidak ada aset yang harus
 * ikut dirawat dan ukurannya selalu tepat. Halaman produk dan artikel tetap
 * memakai fotonya sendiri; yang ini hanya jaring pengaman untuk halaman yang
 * tidak punya gambar.
 */
export const alt = `${SITE_NAME} — Rajut Tangan Yogyakarta`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  /// Logo dibaca dari berkas lalu disisipkan sebagai data URI: gambar di
  /// dalam ImageResponse tidak bisa menunjuk alamat relatif, dan menunggu
  /// permintaan HTTP ke diri sendiri hanya menambah titik gagal.
  const logo = await readFile(join(process.cwd(), "public/logo-mark.png"))
    .then((file) => `data:image/png;base64,${file.toString("base64")}`)
    .catch(() => null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#faf6f1",
        color: "#2f2a26",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {logo && (
          <img src={logo} width={104} height={104} alt="" />
        )}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            color: "#a8624a",
          }}
        >
          RAJUT TANGAN YOGYAKARTA
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 92,
          fontWeight: 700,
          marginTop: 24,
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 34,
          marginTop: 28,
          maxWidth: 900,
          lineHeight: 1.4,
          color: "#5b524b",
        }}
      >
        {SITE_TAGLINE}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 48,
          height: 8,
          width: 220,
          background: "#a8624a",
        }}
      />
    </div>,
    size,
  );
}
