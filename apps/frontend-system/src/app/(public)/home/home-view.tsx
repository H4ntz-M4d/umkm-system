"use client";

import { motion } from "framer-motion";
import heroImage from "@/assets/hero-knitting.jpg";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FeaturedCollection from "@/components/public/home/featured-collection";

export default function HomeView() {
  return (
    <>
      <section className="relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage.src}
            alt="Handmade knitting artisan workspace"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/70 to-background/30" />
        </div>

        <div className="container relative mx-auto px-4 md:px-8 py-20 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-medium tracking-wide uppercase mb-6"
            >
              Handcrafted with Love
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Setiap Rajutan,{" "}
              <span className="text-primary italic">Sebuah Cerita</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
            >
              Karya rajutan tangan Indonesia yang autentik, dibuat dengan cinta
              dari benang-benang pilihan. Setiap helai menyimpan kehangatan
              pengrajin lokal.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-terracotta-dark transition-colors shadow-warm"
              >
                Belanja Sekarang
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-secondary text-secondary-foreground rounded-xl font-medium text-sm hover:bg-cream-dark transition-colors border border-border"
              >
                Jelajahi Koleksi
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative organic divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            className="w-full text-background"
            fill="currentColor"
          >
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>
      <FeaturedCollection />
    </>
  );
}
