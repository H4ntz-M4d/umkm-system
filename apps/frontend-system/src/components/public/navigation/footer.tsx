import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="font-display text-xl font-bold text-background">
              Rajutan<span className="text-primary">Nusa</span>
            </span>
            <p className="text-sm mt-3 leading-relaxed text-background/60">
              Karya rajutan tangan Indonesia yang autentik. Setiap helai dibuat dengan cinta dan ketelitian oleh pengrajin lokal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-background text-sm mb-4">Belanja</h4>
            <ul className="space-y-2.5 text-sm">
              {["Semua Produk", "Cardigan", "Syal & Scarf", "Aksesoris", "Limited Edition"].map((item) => (
                <li key={item}>
                  <Link href={"/products"} className="hover:text-primary transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background text-sm mb-4">Bantuan</h4>
            <ul className="space-y-2.5 text-sm">
              {["FAQ", "Cara Pesan", "Hubungi Kami"].map((item) => (
                <li key={item}>
                  <span className="hover:text-primary transition-colors cursor-pointer">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background text-sm mb-4">Ikuti Kami</h4>
            <ul className="space-y-2.5 text-sm">
              {["Instagram", "TikTok", "Facebook", "WhatsApp"].map((item) => (
                <li key={item}>
                  <span className="hover:text-primary transition-colors cursor-pointer">{item}</span>
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
            <span className="cursor-pointer hover:text-background/80">Kebijakan Privasi</span>
            <span className="cursor-pointer hover:text-background/80">Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
