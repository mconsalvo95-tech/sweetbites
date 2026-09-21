import type { Category, Product } from "./types";

const FLAVORS = [
  { id: "fv-choc", nameEn: "Dark chocolate", nameEs: "Chocolate oscuro" },
  { id: "fv-vanilla", nameEn: "Madagascar vanilla", nameEs: "Vainilla de Madagascar" },
  { id: "fv-salted", nameEn: "Salted caramel", nameEs: "Caramelo salado" },
  { id: "fv-raspberry", nameEn: "Raspberry jam", nameEs: "Mermelada de frambuesa" },
  { id: "fv-hazelnut", nameEn: "Toasted hazelnut", nameEs: "Avellana tostada" },
  { id: "fv-lemon", nameEn: "Lemon zest", nameEs: "Ralladura de limón" },
];

export const CATEGORIES: Category[] = [
  { id: "cat-cookies", nameEn: "Cookies", nameEs: "Galletas", slug: "cookies", sort: 1 },
  { id: "cat-brownies", nameEn: "Brownies", nameEs: "Brownies", slug: "brownies", sort: 2 },
  { id: "cat-cakes", nameEn: "Cakes", nameEs: "Pasteles", slug: "cakes", sort: 3 },
  { id: "cat-pastries", nameEn: "Pastries", nameEs: "Pastelería", slug: "pastries", sort: 4 },
];

const flavorOption = {
  id: "opt-flavors",
  nameEn: "Pick your flavors",
  nameEs: "Elige tus sabores",
  required: true,
  maxSelect: 4,
  values: FLAVORS,
};

export const PRODUCTS: Product[] = [
  {
    id: "prod-choc-chip",
    categoryId: "cat-cookies",
    nameEn: "Brown butter chocolate chip",
    nameEs: "Chispas de chocolate con mantequilla dorada",
    slug: "brown-butter-chocolate-chip",
    descriptionEn: "Crisp edges, soft center, Valrhona chips.",
    descriptionEs: "Bordes crujientes, centro suave, chispas Valrhona.",
    priceCents: 350,
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6d4ee915583e?w=600&h=600&fit=crop",
    leadDays: 0,
    shipWeightG: 120,
    shipLCm: 15,
    shipWCm: 15,
    shipHCm: 5,
    options: [],
  },
  {
    id: "prod-oat-raisin",
    categoryId: "cat-cookies",
    nameEn: "Oat raisin cookie",
    nameEs: "Galleta de avena y pasas",
    slug: "oat-raisin-cookie",
    descriptionEn: "Hearty oats, plump raisins, hint of cinnamon.",
    descriptionEs: "Avena abundante, pasas jugosas, toque de canela.",
    priceCents: 320,
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=600&fit=crop",
    leadDays: 0,
    shipWeightG: 110,
    shipLCm: 15,
    shipWCm: 15,
    shipHCm: 5,
    options: [],
  },
  {
    id: "prod-cookie-box",
    categoryId: "cat-cookies",
    nameEn: "Cookie box of 4",
    nameEs: "Caja de 4 galletas",
    slug: "cookie-box-of-4",
    descriptionEn: "Mix and match four bakery favorites.",
    descriptionEs: "Combina cuatro favoritos de la panadería.",
    priceCents: 1400,
    imageUrl: "https://images.unsplash.com/photo-1620136878700-94c035d29b04?w=600&h=600&fit=crop",
    leadDays: 1,
    shipWeightG: 480,
    shipLCm: 20,
    shipWCm: 20,
    shipHCm: 8,
    options: [flavorOption],
  },
  {
    id: "prod-fudge-brownie",
    categoryId: "cat-brownies",
    nameEn: "Fudge brownie",
    nameEs: "Brownie de fudge",
    slug: "fudge-brownie",
    descriptionEn: "Dense, glossy top, Belgian cocoa.",
    descriptionEs: "Denso, capa brillante, cacao belga.",
    priceCents: 450,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476b?w=600&h=600&fit=crop",
    leadDays: 0,
    shipWeightG: 140,
    shipLCm: 12,
    shipWCm: 12,
    shipHCm: 4,
    options: [],
  },
  {
    id: "prod-walnut-blondie",
    categoryId: "cat-brownies",
    nameEn: "Walnut blondie",
    nameEs: "Blondie de nuez",
    slug: "walnut-blondie",
    descriptionEn: "Butterscotch notes, toasted walnuts.",
    descriptionEs: "Notas de butterscotch, nueces tostadas.",
    priceCents: 480,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop",
    leadDays: 0,
    shipWeightG: 140,
    shipLCm: 12,
    shipWCm: 12,
    shipHCm: 4,
    options: [],
  },
  {
    id: "prod-brownie-box",
    categoryId: "cat-brownies",
    nameEn: "Brownie box of 4",
    nameEs: "Caja de 4 brownies",
    slug: "brownie-box-of-4",
    descriptionEn: "Choose four rich brownie flavors.",
    descriptionEs: "Elige cuatro sabores intensos de brownie.",
    priceCents: 1890,
    imageUrl: "https://images.unsplash.com/photo-1564355808539-22fdaed7556a?w=600&h=600&fit=crop",
    leadDays: 1,
    shipWeightG: 560,
    shipLCm: 20,
    shipWCm: 20,
    shipHCm: 8,
    options: [flavorOption],
  },
  {
    id: "prod-vanilla-loaf",
    categoryId: "cat-cakes",
    nameEn: "Vanilla bean loaf",
    nameEs: "Bizcocho de vainilla",
    slug: "vanilla-bean-loaf",
    descriptionEn: "Moist crumb, real vanilla specks.",
    descriptionEs: "Miga húmeda, puntos de vainilla real.",
    priceCents: 2200,
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop",
    leadDays: 2,
    shipWeightG: 650,
    shipLCm: 25,
    shipWCm: 12,
    shipHCm: 10,
    options: [],
  },
  {
    id: "prod-carrot-slice",
    categoryId: "cat-cakes",
    nameEn: "Carrot cake slice",
    nameEs: "Porción de pastel de zanahoria",
    slug: "carrot-cake-slice",
    descriptionEn: "Cream cheese frosting, toasted pecans.",
    descriptionEs: "Glaseado de queso crema, nueces pecanas.",
    priceCents: 850,
    imageUrl: "https://images.unsplash.com/photo-1621303837578-0a095332a591?w=600&h=600&fit=crop",
    leadDays: 1,
    shipWeightG: 200,
    shipLCm: 15,
    shipWCm: 15,
    shipHCm: 8,
    options: [],
  },
  {
    id: "prod-celebration-cake",
    categoryId: "cat-cakes",
    nameEn: "6\" celebration cake",
    nameEs: "Pastel de celebración 6\"",
    slug: "celebration-cake-6in",
    descriptionEn: "Two layers, buttercream, serves 6–8.",
    descriptionEs: "Dos capas, buttercream, rinde 6–8 porciones.",
    priceCents: 4800,
    imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbae933dc?w=600&h=600&fit=crop",
    leadDays: 3,
    shipWeightG: 1200,
    shipLCm: 25,
    shipWCm: 25,
    shipHCm: 15,
    options: [
      {
        id: "opt-cake-flavor",
        nameEn: "Cake flavor",
        nameEs: "Sabor del pastel",
        required: true,
        maxSelect: 1,
        values: [
          { id: "fv-choc-cake", nameEn: "Chocolate", nameEs: "Chocolate" },
          { id: "fv-vanilla-cake", nameEn: "Vanilla", nameEs: "Vainilla" },
          { id: "fv-red-velvet", nameEn: "Red velvet", nameEs: "Red velvet" },
        ],
      },
    ],
  },
  {
    id: "prod-croissant",
    categoryId: "cat-pastries",
    nameEn: "Butter croissant",
    nameEs: "Croissant de mantequilla",
    slug: "butter-croissant",
    descriptionEn: "Laminated layers, baked fresh each morning.",
    descriptionEs: "Capas laminadas, horneado cada mañana.",
    priceCents: 420,
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=600&fit=crop",
    leadDays: 0,
    shipWeightG: 90,
    shipLCm: 18,
    shipWCm: 10,
    shipHCm: 6,
    options: [],
  },
  {
    id: "prod-cinnamon-roll",
    categoryId: "cat-pastries",
    nameEn: "Cinnamon roll",
    nameEs: "Rollo de canela",
    slug: "cinnamon-roll",
    descriptionEn: "Soft spiral, cream cheese glaze.",
    descriptionEs: "Espiral suave, glaseado de queso crema.",
    priceCents: 520,
    imageUrl: "https://images.unsplash.com/photo-1607950818062-bb3b6717792d?w=600&h=600&fit=crop",
    leadDays: 0,
    shipWeightG: 160,
    shipLCm: 14,
    shipWCm: 14,
    shipHCm: 6,
    options: [],
  },
  {
    id: "prod-pastry-box",
    categoryId: "cat-pastries",
    nameEn: "Pastry box of 4",
    nameEs: "Caja de 4 pastelería",
    slug: "pastry-box-of-4",
    descriptionEn: "Assorted viennoiserie for sharing.",
    descriptionEs: "Viennoiserie surtida para compartir.",
    priceCents: 1890,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop",
    leadDays: 1,
    shipWeightG: 520,
    shipLCm: 22,
    shipWCm: 22,
    shipHCm: 10,
    options: [flavorOption],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export async function fetchCatalog(): Promise<{ categories: Category[]; products: Product[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { categories: CATEGORIES, products: PRODUCTS };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const [catRes, prodRes] = await Promise.all([
      supabase.from("categories").select("*").order("sort"),
      supabase.from("products").select(`
        *,
        product_options (
          id, name_en, name_es, required, max_select,
          option_values ( id, name_en, name_es )
        )
      `).eq("active", true),
    ]);

    if (catRes.error || prodRes.error || !catRes.data?.length) {
      return { categories: CATEGORIES, products: PRODUCTS };
    }

    const categories: Category[] = catRes.data.map((c) => ({
      id: c.id,
      nameEn: c.name_en,
      nameEs: c.name_es,
      slug: c.slug,
      sort: c.sort,
    }));

    const products: Product[] = prodRes.data.map((p) => ({
      id: p.id,
      categoryId: p.category_id,
      nameEn: p.name_en,
      nameEs: p.name_es,
      slug: p.slug,
      descriptionEn: p.description_en,
      descriptionEs: p.description_es,
      priceCents: p.price_cents,
      imageUrl: p.image_url,
      leadDays: p.lead_days,
      shipWeightG: p.ship_weight_g,
      shipLCm: p.ship_l_cm,
      shipWCm: p.ship_w_cm,
      shipHCm: p.ship_h_cm,
      options: (p.product_options ?? []).map((o: {
        id: string;
        name_en: string;
        name_es: string;
        required: boolean;
        max_select: number;
        option_values: { id: string; name_en: string; name_es: string }[];
      }) => ({
        id: o.id,
        nameEn: o.name_en,
        nameEs: o.name_es,
        required: o.required,
        maxSelect: o.max_select,
        values: (o.option_values ?? []).map((v) => ({
          id: v.id,
          nameEn: v.name_en,
          nameEs: v.name_es,
        })),
      })),
    }));

    return { categories, products };
  } catch {
    return { categories: CATEGORIES, products: PRODUCTS };
  }
}

export async function getLiveProductBySlug(slug: string): Promise<Product | undefined> {
  const { products } = await fetchCatalog();
  return products.find((p) => p.slug === slug) ?? getProductBySlug(slug);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
