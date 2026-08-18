import halterPuffDress from "@/assets/halter-puff-dress.jpg";
import polkaDotDress from "@/assets/polka-dot-dress.jpg";
import patchworkDenim from "@/assets/patchwork-denim.jpg";
import corsetSatinSet from "@/assets/corset-satin-set.jpg";
import leatherBag from "@/assets/leather-bag.jpg";
import leopardReal from "@/assets/leopard-real.asset.json";
import capsAsset from "@/assets/img-2319.asset.json";
import floralDressAsset from "@/assets/img-2318.asset.json";
import stripedSetAsset from "@/assets/img-2317.asset.json";
import clawClipsAsset from "@/assets/img-2313.asset.json";
import giftBoxAsset from "@/assets/img-2312.asset.json";

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
    name: "Leopard Mesh Capri Top & Pant",
    price: 39000,
    category: "clothing",
    image: leopardReal.url,
    isNew: true,
    editorial:
      "A second-skin mesh two-piece in a smoked leopard print with contrast lace trim. Long-sleeve button-through top with matching capri leggings — engineered for evening, styled for the street.",
    details: ["Sheer stretch mesh", "Two-piece set", "Lace trim detail", "Hand wash cold, line dry"],
    stock: { S: 4, M: 2, L: 0, XL: 3, XXL: 0 },
  },
  {
    slug: "tie-dye-floral-midi-dress",
    name: "Tie-Dye Floral Ruched Midi Dress",
    price: 37500,
    category: "clothing",
    image: floralDressAsset.url,
    isNew: true,
    editorial:
      "A watercolour floral slip in pastel blue, pink and butter yellow. Ruched bust, sculpted waist panels and a thigh-high back slit — the summer dinner dress.",
    details: ["Ruched stretch jersey", "Adjustable spaghetti straps", "Back slit", "Midi length"],
    stock: { S: 3, M: 4, L: 2, XL: 0, XXL: 0 },
  },
  {
    slug: "striped-polo-pleated-trouser-set",
    name: "Striped Polo & Pleated Trouser Set",
    price: 46000,
    category: "clothing",
    image: stripedSetAsset.url,
    isNew: true,
    editorial:
      "Oversized knit polo in sand, chocolate and burnt orange stripes, paired with high-waist pleated balloon trousers in vivid tangerine. Relaxed volume, resort attitude.",
    details: ["Knit polo with open collar", "Pleated balloon trousers", "Sold as a two-piece set"],
    stock: { S: 2, M: 3, L: 3, XL: 1, XXL: 0 },
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
    name: "Miu Miu Curated Baker Boy Cap",
    price: 25000,
    category: "accessories",
    image: capsAsset.url,
    isNew: false,
    editorial:
      "A curated designer baker boy cap sourced for the MAY & CO. accessories edit. Panelled crown, leather-trim brim and gold lettering — available in black, cream, chocolate and camel.",
    details: ["Curated sourced piece", "Leather-trim brim", "Gold-tone lettering", "One size"],
    stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  },
  {
    slug: "matte-claw-clip-trio",
    name: "Matte Claw Clip Trio",
    price: 9500,
    category: "accessories",
    image: clawClipsAsset.url,
    isNew: true,
    editorial:
      "A set of three oversized matte claw clips in black, espresso and terracotta. Strong-hold hinge, no-slip grip — built for thick hair.",
    details: ["Set of three", "Matte finish", "Strong-hold hinge"],
    stock: { S: 6, M: 6, L: 6, XL: 6, XXL: 6 },
  },
  {
    slug: "curated-accessory-gift-box",
    name: "Curated Accessory Gift Box",
    price: 18000,
    category: "accessories",
    image: giftBoxAsset.url,
    isNew: true,
    editorial:
      "A ready-to-gift window box of scrunchies, pearl sets, stud earrings and clips — curated by tone and packed by hand. Tell us the colour story and we build it.",
    details: ["Hand-packed window box", "Scrunchies, clips, pearls & studs", "Colour story on request"],
    stock: { S: 3, M: 0, L: 0, XL: 0, XXL: 0 },
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
