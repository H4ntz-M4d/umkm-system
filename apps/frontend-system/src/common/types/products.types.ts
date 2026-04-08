export type ProductStatus = 'ACTIVE' | 'NONACTIVE' | 'DRAFT';

export interface ProductResponse {
  success: boolean;
  data: ProductMaster[];
  meta: Meta;
}

export interface ProductResponseById {
  success: boolean;
  data: ProductMaster;
  meta: Meta;
}

export interface ProductMaster {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  useVariant: boolean;
  status: ProductStatus;
  createdAt: string;
  variants: ProductVariant[];
  variantTypes: ProductVariantTypes[]
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  cost: string | null;
  isActive: boolean;
  image: string | null;
  createdAt: string;
  productVariantStocks: ProductVariantStock | null;
}

export interface ProductVariantTypes {
  id: string,
  name: string,
  values: ProductVariantValue[]
}

export interface ProductVariantValue {
  id: string,
  value: string
}

export interface ProductVariantStock {
  id: string;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  updated_at: string;
}

export interface Meta {
  skip: number;
  limit: number;
  total: number;
  timestamp: string;
}
