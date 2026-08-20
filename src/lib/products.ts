export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Category = string;

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  isNew: boolean;
  editorial: string;
  details: string[];
  stock: Record<Size, number>;
};

export type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  position: number;
};

export type StoreSettings = {
  whatsappNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  shippingFee: number;
  transferInstructions: string;
  instagramHandle: string;
};

export type CatalogueItem = {
  id: string;
  title: string;
  tag: string;
  note: string;
  image: string;
  position: number;
};

export const emptyStock = (): Record<Size, number> => ({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });

export const totalStock = (product: Product) =>
  SIZES.reduce((sum, size) => sum + (product.stock[size] ?? 0), 0);

export const availableSizes = (product: Product) =>
  SIZES.filter((size) => (product.stock[size] ?? 0) > 0);
