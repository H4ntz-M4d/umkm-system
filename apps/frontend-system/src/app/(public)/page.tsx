import FeaturedCollection from "@/components/public/home/featured-collection";
import HeroSection from "@/components/public/home/hero-section";
import LatestBlogs from "@/components/public/home/latest-blogs";
import MadeToOrder from "@/components/public/home/made-to-order";

/// Halaman dirakit di server supaya FeaturedCollection bisa jadi async Server
/// Component. Kalau dibungkus komponen client seperti sebelumnya, ia terpaksa
/// mengambil data di browser.
export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedCollection />
      <MadeToOrder />
      <LatestBlogs />
    </>
  );
}
