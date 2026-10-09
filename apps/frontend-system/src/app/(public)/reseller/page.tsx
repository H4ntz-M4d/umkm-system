import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  Boxes,
  HandCoins,
  MessageCircle,
  Truck,
} from "lucide-react";
import ResellerForm from "@/components/public/reseller/reseller-form";
import { canonical } from "@/lib/seo/site";
import { shopWhatsAppUrl } from "../../../../utils/whatsapp";

export const metadata: Metadata = {
  title: "Menjadi Reseller Kami",
  description:
    "Jual kembali tas dan produk rajut tangan Nurfa Craft. Harga khusus reseller, barang siap kirim dari Yogyakarta.",
  alternates: canonical("/reseller"),
};

/// Halaman statis: isiannya tidak disimpan di mana pun, melainkan dirangkai
/// jadi pesan WhatsApp oleh komponen form.

const benefits = [
  {
    icon: BadgePercent,
    title: "Harga khusus reseller",
    desc: "Dihitung dari jumlah pembelian, dibicarakan langsung supaya cocok dengan cara Anda berjualan.",
  },
  {
    icon: Boxes,
    title: "Barang buatan sendiri",
    desc: "Kami yang merajut, jadi stok dan mutunya kami pegang sendiri — bukan mengambil dari pihak lain.",
  },
  {
    icon: HandCoins,
    title: "Bisa mulai dari jumlah kecil",
    desc: "Tidak harus langsung banyak. Yang penting rutin dan cocok dengan pasar Anda.",
  },
  {
    icon: Truck,
    title: "Dikirim ke seluruh Indonesia",
    desc: "Lewat JNE, J&T, atau SiCepat. Bisa juga diambil langsung kalau Anda di sekitar Yogyakarta.",
  },
];

const steps = [
  "Isi formulir di halaman ini — datanya langsung jadi pesan WhatsApp.",
  "Kami balas dengan daftar harga reseller dan produk yang tersedia.",
  "Pilih barangnya, sepakati harga dan jumlahnya.",
  "Pembayaran, lalu barang kami kirim.",
];

export default function Page() {
  return (
    <main>
      <section className="bg-sidebar">
        <div className="container mx-auto px-4 py-16 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <span className="mb-6 inline-block rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-secondary">
              Peluang Usaha
            </span>
            <h1 className="font-display mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">
              Menjadi <span className="italic text-primary">Reseller</span> Kami
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              Jual kembali rajutan tangan Nurfa Craft dengan harga khusus. Cocok
              untuk pemilik toko, penjual online, maupun yang baru mulai
              berjualan dari rumah.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <benefit.icon size={22} strokeWidth={1.5} />
                  </div>
                  <h2 className="font-display mb-1.5 text-base font-semibold text-foreground">
                    {benefit.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-display mb-4 text-2xl font-bold text-foreground">
                Cara memulainya
              </h2>
              <ol className="space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-dashed border-border p-5">
              <h2 className="font-display mb-2 text-base font-semibold text-foreground">
                Masih ragu atau mau bertanya dulu?
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Tidak harus mengisi formulir. Kirim pesan saja, nanti kami
                jelaskan harga dan cara kerjanya.
              </p>
              <a
                href={shopWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-cream-dark"
              >
                <MessageCircle size={16} />
                Tanya lewat WhatsApp
              </a>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <h2 className="font-display mb-1 text-xl font-bold text-foreground">
              Formulir pendaftaran
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Isi datanya, lalu percakapan WhatsApp akan terbuka berisi
              keterangan ini.
            </p>
            <ResellerForm />
          </div>
        </div>
      </section>

      <section className="bg-sidebar">
        <div className="container mx-auto px-4 py-12 md:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Ingin melihat produknya dulu?{" "}
            <Link
              href="/products"
              className="font-medium text-primary underline underline-offset-2"
            >
              Lihat katalog kami
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
