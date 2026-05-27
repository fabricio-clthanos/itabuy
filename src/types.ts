export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  salesCount: number; // Volume of units sold (e.g. 1.2k vendidos)
  freeShipping: boolean;
  discountPercentage?: number;
  images: string[];
  category: string;
  location: string; // e.g., "São Paulo", "Itapeva - SP", "Minas Gerais"
  stock: number;
  pixPrice?: number;
  description: string;
  specs: { [key: string]: string };
  availableOptions?: { name: string; values: { label: string; stock?: number }[] }[];
  storeName: string;
  storeRating: number;
  storeProductsCount: number;
}

export interface CartItem {
  id: string; // unique ID for cart item
  product: Product;
  quantity: number;
  selected: boolean;
  selectedSpec?: {
    [optionName: string]: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discount: number; // in BR REAL or percentage
  type: 'percentage' | 'fixed';
  minSpent: number;
  title: string;
  expiry: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  spec: string;
}
