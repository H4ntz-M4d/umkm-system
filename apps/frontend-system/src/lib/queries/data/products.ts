import productCardigan from "@/assets/products/product-cardigan.jpg";
import productScarf from "@/assets/products/product-scarf.jpg";
import productBeanie from "@/assets/products/product-beanie.jpg";
import productBlanket from "@/assets/products/product-blanket.jpg";
import productBooties from "@/assets/products/product-booties.jpg";
import productTote from "@/assets/products/product-tote.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  variants: { colors: string[]; sizes: string[] };
  isLimited?: boolean;
  isPreOrder?: boolean;
  isMadeToOrder?: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  isTrending?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Cardigan Rajut Klasik",
    price: 485000,
    image: productCardigan.src,
    category: "Cardigan",
    variants: { colors: ["Cream", "Beige", "Dusty Rose"], sizes: ["S", "M", "L", "XL"] },
    isLimited: true,
    stock: 5,
    rating: 4.9,
    reviewCount: 128,
    isTrending: true,
  },
  {
    id: "2",
    name: "Syal Rajut Terracotta",
    price: 195000,
    image: productScarf.src,
    category: "Syal",
    variants: { colors: ["Terracotta", "Olive", "Cream"], sizes: ["One Size"] },
    stock: 12,
    rating: 4.8,
    reviewCount: 89,
    isTrending: true,
  },
  {
    id: "3",
    name: "Beanie Rajut Olive",
    price: 145000,
    image: productBeanie.src,
    category: "Topi",
    variants: { colors: ["Olive", "Cream", "Brown"], sizes: ["One Size"] },
    isPreOrder: true,
    stock: 0,
    rating: 4.7,
    reviewCount: 56,
  },
  {
    id: "4",
    name: "Selimut Rajut Premium",
    price: 750000,
    image: productBlanket.src,
    category: "Selimut",
    variants: { colors: ["Cream", "Beige"], sizes: ["Single", "Double"] },
    isLimited: true,
    stock: 3,
    rating: 5.0,
    reviewCount: 42,
    isTrending: true,
  },
  {
    id: "5",
    name: "Sepatu Bayi Rajut",
    price: 125000,
    image: productBooties.src,
    category: "Aksesoris",
    variants: { colors: ["Dusty Rose", "Cream", "Blue"], sizes: ["0-6M", "6-12M"] },
    isMadeToOrder: true,
    stock: 99,
    rating: 4.9,
    reviewCount: 215,
  },
  {
    id: "6",
    name: "Tote Bag Rajut Artisan",
    price: 285000,
    image: productTote.src,
    category: "Tas",
    variants: { colors: ["Cream/Terracotta", "Olive/Cream"], sizes: ["One Size"] },
    stock: 8,
    rating: 4.6,
    reviewCount: 67,
  },
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};
