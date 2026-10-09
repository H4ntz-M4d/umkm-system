import type { Metadata } from "next";
import "./globals.css";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  canonical,
} from "@/lib/seo/site";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {
  Inter,
  DM_Sans,
  Instrument_Serif,
  Playfair_Display,
} from "next/font/google";

export const metadata: Metadata = {
  /// Alamat dasar untuk canonical dan gambar pratinjau. Tanpa ini, alamat
  /// relatif tidak pernah berubah jadi alamat penuh, dan pratinjau tautan di
  /// WhatsApp atau media sosial gagal memuat gambarnya.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Rajut Tangan Yogyakarta`,
    /// Halaman anak cukup menulis namanya sendiri; nama toko ditempelkan di
    /// sini supaya tidak ditulis ulang (dan tidak pernah beda) di tiap berkas.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "tas rajut",
    "rajut tangan",
    "rajutan jogja",
    "nurfa craft",
    "tas rajut handmade",
    "produk rajut Indonesia",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Rajut Tangan Yogyakarta`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Rajut Tangan Yogyakarta`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: canonical("/"),
};

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-Instrument", // Mencocokkan --font-Instrument di CSS kamu
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display", // Mencocokkan --font-display di CSS kamu
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body", // Ini mencocokkan variabel di CSS kamu
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${dmSans.variable} ${instrumentSerif.variable} ${playfairDisplay.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackProvider>{children}</TanstackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
