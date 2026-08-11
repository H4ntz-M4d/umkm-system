import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotFoundBackButton } from "@/components/not-found-back-button";

/**
 * Selain melayani URL yang benar-benar tidak ada, halaman ini juga yang tampil
 * ketika sebuah role mencoba membuka halaman manajemen di luar haknya (lihat
 * `src/proxy.ts`). Karena itu teksnya sengaja netral — tidak menyebut soal izin
 * maupun mengonfirmasi bahwa halamannya memang ada.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* Sapuan warna latar, dibuat sangat samar agar tidak melawan teks */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl sm:size-96"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 size-72 rounded-full bg-secondary/10 blur-3xl sm:size-96"
      />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <YarnBall className="size-32 text-primary sm:size-40" />

        <p className="mt-8 font-instrument text-7xl leading-none text-foreground sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 font-display text-2xl font-medium text-foreground sm:text-3xl">
          Halaman tidak ditemukan
        </h1>

        <p className="mt-3 max-w-md text-pretty text-sm text-muted-foreground sm:text-base">
          Benangnya terputus di sini. Halaman yang Anda tuju mungkin sudah
          dipindahkan, dihapus, atau alamatnya keliru.
        </p>

        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <NotFoundBackButton />
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              Kembali ke beranda
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

/**
 * Bola rajut dengan benang yang terurai — memakai `currentColor` supaya ikut
 * warna tema, termasuk saat mode gelap.
 */
function YarnBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      strokeLinecap="round"
      className={className}
      role="img"
      aria-label="Ilustrasi bola rajut dengan benang terurai"
    >
      <circle
        cx="54"
        cy="52"
        r="34"
        className="fill-primary/10 stroke-current"
        strokeWidth="2.5"
      />
      {/* Jalinan benang pada permukaan bola */}
      <g stroke="currentColor" strokeWidth="2" className="opacity-70">
        <path d="M26 44c14 6 30 8 46 4 6-1.5 11-4 15-7" />
        <path d="M22 60c16 5 34 5 50-1 6-2.2 11-5.3 15-9" />
        <path d="M28 74c14 3 29 1 42-5 5-2.3 9-5.2 13-8.6" />
        <path d="M40 24c-4 10-6 21-5 32 .7 8 2.8 15 6 21" />
        <path d="M58 19c-5 11-7 23-6 35 .8 9 3 17 7 24" />
        <path d="M76 25c-4 9-6 19-5 29 .7 8 2.6 15 5.6 21" />
      </g>
      {/* Benang yang terurai keluar, menegaskan kesan "terputus" */}
      <path
        d="M86 68c8 5 13 11 12 17-1 7-9 11-17 9-7-1.8-10-8-7-12 2.6-3.6 8.4-3 10 1 1.4 3.6-1 7.6-5 8.8"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-90"
      />
    </svg>
  );
}
