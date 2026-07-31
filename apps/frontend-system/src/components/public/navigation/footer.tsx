import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="font-display text-xl font-bold text-background">
              Nurfa<span className="text-primary">Craft</span>
            </span>
            <p className="text-sm mt-3 leading-relaxed text-background/60">
              Karya rajutan tangan Indonesia yang autentik. Setiap helai dibuat
              dengan cinta dan ketelitian oleh pengrajin lokal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-background text-sm mb-4">
              Belanja
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Semua Produk", path: "/products" },
                { label: "Keranjang", path: "/cart" },
                { label: "Wishlist", path: "/wishlist" },
                { label: "Riwayat Pesanan", path: "/orders" },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background text-sm mb-4">
              Bantuan
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "FAQ", path: "/" },
                { label: "Cara Pesan", path: "/" },
                { label: "Hubungi Kami", path: "https://wa.me/6288232000188" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.path}
                    className="hover:text-primary transition-colors"
                  >
                    <span className="text-background/60">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background text-sm mb-4">
              Ikuti Kami
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                {
                  label: "Instagram",
                  path: "https://www.instagram.com/nurfacraft_jogja?igsh=MTdncGxudGIzbDQzMA==",
                },
                { label: "TikTok", path: "https://www.tiktok.com/@tasrajutjogjanurfa" },
                { label: "Facebook", path: "https://www.facebook.com/tasrajutjogjanurfa" },
                { label: "WhatsApp", path: "https://wa.me/6288232000188" },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="hover:text-primary transition-colors"
                  >
                    <span className="text-background/60">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            © 2026 Nurfa Craft. Semua hak dilindungi.
          </p>
          <div className="flex items-center gap-4 text-xs text-background/50">
            <span>Midtrans</span>
            <span>•</span>
            <span>JNE</span>
            <span>•</span>
            <span>J&T</span>
            <span>•</span>
            <span>SiCepat</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-background/50">
            <span>Kebijakan Privasi</span>
            <span>Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
