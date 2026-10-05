"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { shop } from "@/lib/shop";
import { t } from "@/lib/format";

export const SITE_PAGE_SLUGS = [
  "about",
  "faq",
  "events",
  "stores",
  "wholesale",
  "contact",
  "location",
] as const;

export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

export type FaqItem = { qEn: string; qEs: string; aEn: string; aEs: string };
export type EventItem = {
  nameEn: string;
  nameEs: string;
  dateEn: string;
  dateEs: string;
  locEn: string;
  locEs: string;
};
export type StoreItem = {
  nameEn: string;
  nameEs: string;
  addrEn: string;
  addrEs: string;
  noteEn: string;
  noteEs: string;
};

export type AboutBody = {
  photo_url: string;
  p1_en: string;
  p1_es: string;
  p2_en: string;
  p2_es: string;
};

export type FaqBody = { items: FaqItem[] };
export type EventsBody = { intro_en: string; intro_es: string; items: EventItem[] };
export type StoresBody = { intro_en: string; intro_es: string; items: StoreItem[] };
export type WholesaleBody = { intro_en: string; intro_es: string };
export type ContactBody = { intro_en: string; intro_es: string };
export type LocationBody = {
  street: string;
  cityLine: string;
  country: string;
  hours_en: string[];
  hours_es: string[];
  placeholder_en: string;
  placeholder_es: string;
};

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    qEn: "How does pickup work?",
    qEs: "¿Cómo funciona la recogida?",
    aEn: "Order online, choose pickup, and we'll text when your box is ready in Red Deer.",
    aEs: "Pide en línea, elige recoger, y te avisaremos cuando tu caja esté lista en Red Deer.",
  },
  {
    qEn: "Do you deliver locally?",
    qEs: "¿Hacen entrega local?",
    aEn: "Yes — Red Deer-area delivery is a flat $6. Enter your address at checkout.",
    aEs: "Sí — entrega en Red Deer por $6 fijo. Ingresa tu dirección al pagar.",
  },
  {
    qEn: "Can you ship across Canada?",
    qEs: "¿Envían a todo Canadá?",
    aEn: "Yes, via Canada Post. Rates show at checkout from our Red Deer kitchen.",
    aEs: "Sí, con Canada Post. Las tarifas se muestran al pagar, desde nuestra cocina en Red Deer.",
  },
  {
    qEn: "What's your return policy?",
    qEs: "¿Cuál es la política de devoluciones?",
    aEn: "Because our treats are perishable, we can't accept returns — but if something's wrong, contact us and we'll make it right.",
    aEs: "Como nuestros productos son perecederos, no aceptamos devoluciones — pero si algo sale mal, contáctanos y lo arreglamos.",
  },
  {
    qEn: "Do you offer wholesale?",
    qEs: "¿Ofrecen mayoreo?",
    aEn: "Yes! Cafés, offices, and events — fill out the wholesale form and we'll reply within 2 business days.",
    aEs: "¡Sí! Cafés, oficinas y eventos — llena el formulario de mayoreo y respondemos en 2 días hábiles.",
  },
];

export const SITE_PAGE_DEFAULTS: Record<SitePageSlug, Record<string, unknown>> = {
  about: {
    photo_url: "",
    p1_en:
      "Meet the heart and soul behind Sweet Bites. Rocio and Daniela are a mother-daughter team who share a love for baking.",
    p1_es:
      "Conoce el corazón de Sweet Bites. Rocio y Daniela son un equipo de madre e hija que comparten el amor por la repostería.",
    p2_en:
      "We moved to Canada in 2001 from Colombia. A trip to Argentina introduced us to alfajores: a shortbread cookie filled with dulce de leche, with coconut flakes on the side. Rocio learned to make them, and they became one of the staples at Sweet Bites. We can't wait to see what the future holds for Sweet Bites.",
    p2_es:
      "Nos mudamos a Canadá en 2001 desde Colombia. Un viaje a Argentina nos presentó los alfajores: una galleta de manteca rellena de dulce de leche, con coco rallado al lado. Rocio aprendió a prepararlos y se convirtieron en uno de los clásicos de Sweet Bites. No vemos la hora de descubrir qué nos depara el futuro para Sweet Bites.",
  } satisfies AboutBody,
  faq: { items: DEFAULT_FAQ_ITEMS } satisfies FaqBody,
  events: {
    intro_en: "Find us at these upcoming markets.",
    intro_es: "Encuéntranos en estos mercados.",
    items: [
      {
        nameEn: "Distillery Sunday Market",
        nameEs: "Mercado dominical Distillery",
        dateEn: "Oct 5, 2026 · 10am – 3pm",
        dateEs: "5 oct 2026 · 10am – 3pm",
        locEn: "Distillery District, Toronto",
        locEs: "Distillery District, Toronto",
      },
      {
        nameEn: "Leslieville Farmers Market",
        nameEs: "Mercado Leslieville",
        dateEn: "Oct 19, 2026 · 9am – 2pm",
        dateEs: "19 oct 2026 · 9am – 2pm",
        locEn: "Jonathan Ashbridge Park",
        locEs: "Parque Jonathan Ashbridge",
      },
    ],
  } satisfies EventsBody,
  stores: {
    intro_en: "Grab Sweetbites at these local retailers.",
    intro_es: "Consigue Sweetbites en estos comercios.",
    items: [
      {
        nameEn: "Morning Brew Café",
        nameEs: "Morning Brew Café",
        addrEn: "88 Queen St E, Toronto",
        addrEs: "88 Queen St E, Toronto",
        noteEn: "Cookie boxes + brownie bites",
        noteEs: "Cajas de galletas + brownie bites",
      },
      {
        nameEn: "The Pantry General",
        nameEs: "The Pantry General",
        addrEn: "412 Roncesvalles Ave, Toronto",
        addrEs: "412 Roncesvalles Ave, Toronto",
        noteEn: "Weekend pastry selection",
        noteEs: "Selección de pastelería de fin de semana",
      },
    ],
  } satisfies StoresBody,
  wholesale: {
    intro_en: "Cafés, offices, and events — tell us what you need and we'll get back to you.",
    intro_es: "Cafés, oficinas y eventos — cuéntanos qué necesitas y te responderemos.",
  } satisfies WholesaleBody,
  contact: {
    intro_en: "Questions about an order or custom request? Send us a message.",
    intro_es: "¿Preguntas sobre un pedido o algo personalizado? Escríbenos.",
  } satisfies ContactBody,
  location: {
    street: shop.street,
    cityLine: shop.cityLine,
    country: shop.country,
    hours_en: ["Mon–Fri: 8am – 6pm", "Sat: 9am – 5pm", "Sun: 10am – 3pm"],
    hours_es: ["Lun–Vie: 8am – 6pm", "Sáb: 9am – 5pm", "Dom: 10am – 3pm"],
    placeholder_en: "",
    placeholder_es: "",
  } satisfies LocationBody,
};

function mergeBody<T extends Record<string, unknown>>(defaults: T, raw: unknown): T {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const patch = raw as Record<string, unknown>;
  if (!Object.keys(patch).length) return defaults;
  return { ...defaults, ...patch } as T;
}

export function useSitePageBody<S extends SitePageSlug>(slug: S) {
  type Body = (typeof SITE_PAGE_DEFAULTS)[S];
  const defaults = SITE_PAGE_DEFAULTS[slug] as Body;
  const [body, setBody] = useState<Body>(defaults);

  useEffect(() => {
    const base = SITE_PAGE_DEFAULTS[slug] as Body;
    setBody(base);
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    void supabase
      .from("site_pages")
      .select("body")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setBody(mergeBody(base, data?.body));
      });
  }, [slug]);

  return body;
}

export function sitePageTabLabel(slug: SitePageSlug, lang: "en" | "es") {
  const labels: Record<SitePageSlug, { en: string; es: string }> = {
    about: { en: "About", es: "Nosotros" },
    faq: { en: "FAQ", es: "Preguntas" },
    events: { en: "Events", es: "Eventos" },
    stores: { en: "Stores", es: "Tiendas" },
    wholesale: { en: "Wholesale", es: "Mayoreo" },
    contact: { en: "Contact", es: "Contacto" },
    location: { en: "Location", es: "Ubicación" },
  };
  return lang === "es" ? labels[slug].es : labels[slug].en;
}

export function photoPlaceholder(lang: "en" | "es") {
  return t("Photo coming soon", "Foto próximamente", lang);
}
