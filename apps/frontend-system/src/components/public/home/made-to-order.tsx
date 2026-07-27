"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Palette, Scissors, Truck } from "lucide-react";

const steps = [
  {
    icon: Palette,
    title: "Pilih Desain",
    desc: "Pilih model, warna, dan ukuran sesuai keinginanmu. Kami siap menyesuaikan.",
  },
  {
    icon: Scissors,
    title: "Kami Rajut Untukmu",
    desc: "Pengrajin kami mulai merajut pesananmu dengan penuh perhatian dan detail.",
  },
  {
    icon: Truck,
    title: "Sampai di Rumahmu",
    desc: "Dikemas cantik dan dikirim langsung ke rumahmu dengan aman.",
  },
];

const MadeToOrder = () => {
  return (
    <section className="py-16 md:py-24 bg-sidebar">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant={'ghost'} className="text-xs font-medium uppercase tracking-widest text-secondary">Custom Made</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
            Dibuat Khusus Untukmu
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
            Pesanan made-to-order membutuhkan waktu 7–14 hari kerja untuk pengerjaan.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-5">
                <step.icon size={28} strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-center mb-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MadeToOrder;
