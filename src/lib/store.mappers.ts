import { SIZES, emptyStock, type Product, type Size } from "@/lib/products";

type RawVariant = { size: string; stock: number };

export type RawProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category_slug: string;
  image: string;
  editorial: string;
  details: string[] | null;
  is_new: boolean;
  product_variants?: RawVariant[] | null;
};

export function mapProduct(row: RawProduct): Product {
  const stock = emptyStock();
  for (const v of row.product_variants ?? []) {
    if ((SIZES as readonly string[]).includes(v.size)) stock[v.size as Size] = v.stock;
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    category: row.category_slug,
    image: row.image,
    isNew: row.is_new,
    editorial: row.editorial,
    details: row.details ?? [],
    stock,
  };
}
