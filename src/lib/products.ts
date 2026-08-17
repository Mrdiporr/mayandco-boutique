import leopardMeshSet from "@/assets/leopard-mesh-set.jpg";
import halterPuffDress from "@/assets/halter-puff-dress.jpg";
import polkaDotDress from "@/assets/polka-dot-dress.jpg";
import patchworkDenim from "@/assets/patchwork-denim.jpg";
import curatedCap from "@/assets/curated-cap.jpg";
import corsetSatinSet from "@/assets/corset-satin-set.jpg";
import leatherBag from "@/assets/leather-bag.jpg";

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Category = "clothing" | "accessories";

export type Product = {
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

export const PRODUCTS: Product[] = [
  {
    slug: "leopard-mesh-set",
    name: "Leopard Mesh Set",
    price: 39000,
    category: "clothing",
    image: leopardMeshSet,
    isNew: true,
    editorial:
      "A second-skin mesh two-piece in a smoked leopard print. Sculpted halter top with a high-rise flared trouser — engineered for evening, styled for the street.",
    details: ["Sheer stretch mesh", "Two-piece set", "Hand wash cold, line dry"],
    stock: { S: 4, M: 2, L: 0, XL: 3, XXL: 0 },
  },
  {
    slug: "halter-neck-puff-dress",
    name: "Halter Neck Puff Dress",
    price: 41500,
    category: "clothing",
    image: halterPuffDress,
    isNew: true,
    editorial:
      "Structured ivory mini with an exaggerated puff sleeve and a plunging halter neckline. Tailored panels hold the silhouette from morning to midnight.",
    details: ["Structured crepe", "Concealed back zip", "Fully lined"],
    stock: { S: 0, M: 5, L: 3, XL: 0, XXL: 1 },
  },
  {
    slug: "pleated-polka-dot-dress",
    name: "Pleated Polka Dot Dress",
    price: 42000,
    category: "clothing",
    image: polkaDotDress,
    isNew: true,
    editorial:
      "Micro-pleated midi in a graphic monochrome dot, cinched with a grosgrain waistband. Movement is the point.",
    details: ["Micro-pleated georgette", "Elasticated waistband", "Midi length"],
    stock: { S: 2, M: 0, L: 4, XL: 2, XXL: 0 },
  },
  {
    slug: "patchwork-denim-trousers",
    name: "Patchwork Denim Trousers",
    price: 45500,
    category: "clothing",
    image: patchworkDenim,
    isNew: false,
    editorial:
      "Wide-leg denim assembled from four contrast washes. Rigid at the waist, fluid through the leg — a workwear silhouette with couture proportions.",
    details: ["100% rigid cotton denim", "Contrast patch panels", "Wide-leg fit"],
    stock: { S: 3, M: 3, L: 0, XL: 1, XXL: 2 },
  },
  {
    slug: "miu-miu-curated-cap",
    name: "Miu Miu Curated Cap",
    price: 25000,
    category: "accessories",
    image: curatedCap,
    isNew: false,
    editorial:
      "A curated designer cap sourced for the MAY & CO. accessories edit. Matte black, low crown, pre-curved brim.",
    details: ["Curated sourced piece", "Adjustable strap", "One size"],
    stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  },
  {
    slug: "sculpted-corset-satin-set",
    name: "Sculpted Corset & Satin Skirt",
    price: 52000,
    category: "clothing",
    image: corsetSatinSet,
    isNew: true,
    editorial:
      "Boned corset bodice paired with a bias-cut satin maxi. Architectural above, liquid below.",
    details: ["Boned corsetry", "Bias-cut satin skirt", "Hook-and-eye closure"],
    stock: { S: 1, M: 2, L: 2, XL: 0, XXL: 0 },
  },
  {
    slug: "alabaster-mini-shoulder-bag",
    name: "Alabaster Mini Shoulder Bag",
    price: 38000,
    category: "accessories",
    image: leatherBag,
    isNew: false,
    editorial:
      "A compact grained-leather shoulder bag with warm gold hardware. Built for the essentials and nothing else.",
    details: ["Grained leather", "Gold-tone hardware", "Detachable strap"],
    stock: { S: 2, M: 0, L: 0, XL: 0, XXL: 0 },
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const totalStock = (product: Product) =>
  SIZES.reduce((sum, size) => sum + product.stock[size], 0);

export const availableSizes = (product: Product) =>
  SIZES.filter((size) => product.stock[size] > 0);
