import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Heart,
  MessageCircle,
  Package,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { BESPOKE_MIN_QUANTITY_CUSTOM } from "@repo/schemas";
import { canonical } from "@/lib/seo/site";
import { JsonLd, faqSchema } from "@/lib/seo/json-ld";
import { shopWhatsAppUrl } from "../../../../utils/whatsapp";

export const metadata: Metadata = {
  title: "Tentang Kami",
  alternates: canonical("/about"),
  description:
    "Nurfa Craft merajut tas dan perlengkapan rajut tangan dari Yogyakarta — dikerjakan satu per satu oleh pengrajin, bisa dipesan sesuai keinginan.",
};

/// Halaman statis: tidak ada data dari server, jadi Server Component tanpa
/// pengambilan data sama sekali. Teksnya ditulis di kode supaya owner cukup
/// mengoreksi satu berkas ini.

const processSteps = [
  {
    icon: Palette,
    title: "Pilih desain",
    desc: "Model, warna, dan ukuran ditentukan lebih dulu. Untuk pesanan khusus, kami bahas detailnya bersama pemesan sampai sepakat.",
  },
  {
    icon: Scissors,
    title: "Dirajut satu per satu",
    desc: "Setiap produk dikerjakan tangan oleh pengrajin, bukan mesin. Karena itu satu barang butuh waktu, dan tidak ada dua yang benar-benar identik.",
  },
  {
    icon: ShieldCheck,
    title: "Diperiksa sebelum dikirim",
    desc: "Hasil rajutan diperiksa dulu — rapi jahitannya, kuat pegangannya, bersih benangnya. Yang belum lolos dikerjakan ulang.",
  },
  {
    icon: Package,
    title: "Dikemas & dikirim",
    desc: "Dikemas rapi lalu dikirim lewat ekspedisi pilihanmu, atau bisa diambil langsung kalau kamu di sekitar Yogyakarta.",
  },
];

const values = [
  {
    icon: Heart,
    title: "Buatan tangan, bukan pabrikan",
    desc: "Tiap simpul dikerjakan manual oleh pengrajin kami. Rapinya datang dari kesabaran, bukan dari mesin.",
  },
  {
    icon: Sparkles,
    title: "Bisa dibuat sesuai permintaan",
    desc: `Produk katalog bisa diminta dengan warna atau ukuran lain, berapa pun jumlahnya. Model yang sama sekali baru dikerjakan mulai dari ${BESPOKE_MIN_QUANTITY_CUSTOM} pcs.`,
  },
  {
    icon: Boxes,
    title: "Melayani reseller",
    desc: "Beberapa toko sudah menjual kembali produk kami. Untuk pembelian jumlah banyak, harganya kami hitung tersendiri.",
  },
];

const orderSteps = [
  {
    title: "Pilih produk",
    desc: "Telusuri katalog, pilih varian dan jumlahnya, lalu masukkan ke keranjang.",
  },
  {
    title: "Ajukan pesanan",
    desc: "Isi data pengiriman di halaman checkout. Untuk pesanan khusus atau jumlah banyak, ajukan lewat WhatsApp supaya harga dan waktunya bisa dibicarakan dulu.",
  },
  {
    title: "Pembayaran",
    desc: "Pesanan siap kirim dibayar lewat Midtrans (transfer, e-wallet, kartu). Pesanan yang harus dirajut dulu bisa dimulai dengan uang muka.",
  },
  {
    title: "Dikerjakan & dikirim",
    desc: "Pesanan made-to-order dikerjakan sesuai antrian pada hari kerja dengan minimal pengerjaan sekitaran 1 bulanan. Begitu selesai dan pelunasan masuk, barang dikirim dan nomor resinya kami kabarkan.",
  },
];

const faqs = [
  {
    q: "Berapa lama pengerjaannya?",
    a: "Produk yang stoknya ada langsung dikirim. Pesanan yang dirajut dulu (made-to-order) butuh minimal 1 bulanan pengerjaan pada hari kerja, tergantung model dan antrean pengerjaan. Jadi pesanan bisa lebih lama selesainya jika antrean banyak dan produk yang di pesan juga banyak.",
  },
  {
    q: "Bisa minta warna atau ukuran lain dari produk yang ada?",
    a: "Bisa, dan tidak ada jumlah minimum. Selama modelnya ada di katalog, polanya sudah kami punya — jadi satu pcs pun kami kerjakan, termasuk kalau warnanya diganti.",
  },
  {
    q: "Bisa pesan model yang sama sekali baru?",
    a: `Bisa, dengan jumlah minimal ${BESPOKE_MIN_QUANTITY_CUSTOM} pcs. Model baru berarti polanya dirancang dan diuji dari nol, dan pekerjaan itu baru sepadan untuk pesanan dalam jumlah banyak — misalnya seragam komunitas, souvenir acara, atau stok untuk dijual kembali. Kirim gambarannya lewat WhatsApp, nanti kami hitungkan harga dan waktunya.`,
  },
  {
    q: "Metode pembayarannya apa saja?",
    a: "Transfer bank, e-wallet, dan kartu lewat Midtrans. Untuk pesanan khusus, pembayaran bisa dibagi: uang muka di awal dan pelunasan setelah barang selesai.",
  },
  {
    q: "Pengirimannya pakai apa?",
    a: "JNE, J&T, dan SiCepat, menyesuaikan tujuan. Kalau kamu di sekitar Yogyakarta, barang juga bisa diambil langsung.",
  },
  {
    q: "Kalau barangnya tidak sesuai bagaimana?",
    a: "Hubungi kami lewat WhatsApp dengan foto barangnya, sebaiknya di hari yang sama saat paket diterima, supaya bisa kami cek dan carikan jalan keluarnya.",
  },
  {
    q: "Bisa jadi reseller?",
    a: "Bisa. Hubungi kami lewat WhatsApp untuk membicarakan harga khusus dan jumlah pembelian minimalnya.",
  },
];

export default function Page() {
  return (
    <main>
      {/* Daftar tanya jawab yang sama persis dengan yang dibaca pengunjung di
          bawah — isinya tidak boleh berbeda, karena Google membandingkannya
          dengan halaman. */}
      <JsonLd data={faqSchema(faqs)} />

      {/* Pembuka */}
      <section className="bg-sidebar">
        <div className="container mx-auto px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-2xl">
            <span className="mb-6 inline-block rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-secondary">
              Tentang Kami
            </span>
            <h1 className="font-display mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">
              Merajut dari Yogyakarta,{" "}
              <span className="italic text-primary">satu per satu</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              Nurfa Craft membuat tas dan perlengkapan rajut tangan. Semuanya
              dikerjakan manual oleh pengrajin — tidak ada mesin yang
              menggantikan tangan, dan tidak ada pesanan yang dikerjakan
              terburu-buru.
            </p>
          </div>
        </div>
      </section>

      {/* Cerita */}
      <section className="container mx-auto px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display mb-4 text-2xl font-bold text-foreground md:text-3xl">
              Cerita kami
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Nurfa Craft berawal dari kebiasaan merajut di rumah — awalnya
                untuk dipakai sendiri, lalu dipesan tetangga, lalu terus
                berlanjut sampai jadi pekerjaan sehari-hari.
              </p>
              <p>
                Sampai sekarang cara kerjanya tidak banyak berubah. Setiap tas
                dirajut tangan, diperiksa satu per satu sebelum dikirim, dan
                dikerjakan oleh orang yang kami kenal namanya. Yang bertambah
                hanya jumlah pesanan dan tempat barangnya sampai.
              </p>
              <p>
                Kami juga menerima pesanan khusus: warna, ukuran, atau model
                yang belum ada di katalog. Kalau kamu sudah punya gambarannya,
                kami bantu wujudkan.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="font-display mb-1.5 text-base font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proses produksi */}
      <section className="bg-sidebar">
        <div className="container mx-auto px-4 py-16 md:px-8 md:py-20">
          <div className="mb-12 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Dari benang sampai ke tanganmu
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Empat tahap yang dilewati setiap pesanan, baik yang sudah ada
              stoknya maupun yang dirajut khusus.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="mb-5 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon size={28} strokeWidth={1.5} />
                </div>
                <div className="mb-3 flex items-center justify-center">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara pesan — ditautkan dari footer */}
      <section
        id="cara-pesan"
        className="container mx-auto scroll-mt-24 px-4 py-16 md:px-8 md:py-20"
      >
        <div className="mb-10">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Cara pesan
          </h2>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            Belanja bisa lewat katalog online, atau langsung lewat WhatsApp
            kalau pesananmu perlu dibicarakan dulu.
          </p>
        </div>

        <ol className="grid gap-5 md:grid-cols-4">
          {orderSteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <span className="font-display mb-3 block text-3xl font-bold text-primary/30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mb-1.5 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ — ditautkan dari footer. Memakai <details> supaya bisa dibuka
          tutup tanpa JavaScript sama sekali. */}
      <section id="faq" className="bg-sidebar scroll-mt-24">
        <div className="container mx-auto px-4 py-16 md:px-8 md:py-20">
          <h2 className="font-display mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">
            Pertanyaan yang sering masuk
          </h2>

          <div className="mx-auto max-w-2xl space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card px-5 py-4"
              >
                <summary className="font-display cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {faq.q}
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                    />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Ajakan */}
      <section className="container mx-auto px-4 py-16 md:px-8 md:py-20">
        <div className="rounded-2xl border border-border bg-card p-8 text-center md:p-12">
          <h2 className="font-display mb-3 text-2xl font-bold text-foreground md:text-3xl">
            Ada yang ingin ditanyakan?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
            Kirim pesan ke WhatsApp kami — pertanyaan soal ukuran, warna, atau
            pesanan khusus dijawab langsung oleh tim kami.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={shopWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-terracotta-dark"
            >
              <MessageCircle size={16} />
              Chat WhatsApp
            </a>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-8 py-3.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-cream-dark"
            >
              <Truck size={16} />
              Lihat katalog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
