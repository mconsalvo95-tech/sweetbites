"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { formatCad, t } from "@/lib/format";
import { parseProductImages, serializeProductImages } from "@/lib/product-images";
import { DEFAULT_REVIEW_IMAGE, FALLBACK_REVIEW_ITEMS, type ReviewItem } from "@/lib/reviews";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PromoKind } from "@/lib/promos";
import {
  SITE_PAGE_DEFAULTS,
  SITE_PAGE_SLUGS,
  sitePageTabLabel,
  type SitePageSlug,
} from "@/lib/site-pages";
import {
  ORDER_TAB_STATUSES,
  bulkOrderActionLabel,
  bulkStatusForOrder,
  canEraseOrdersTab,
  customerOrderStatusLabel,
  fulfilledStatusFor,
  isMidFulfillmentStatus,
  reopenStatusFor,
  type OrderTabStatus,
} from "@/lib/order-status";

const inputClass =
  "w-full rounded-xl border border-blush/60 bg-white px-3 py-2 text-sm text-coal outline-none focus:border-berry";

type PromoRow = {
  code: string;
  kind: PromoKind;
  value: number;
  min_food_cents: number;
  active: boolean;
  expires_at: string | null;
};

type ProductRow = {
  id: string;
  name_en: string;
  name_es: string;
  slug: string;
  price_cents: number;
  active: boolean;
  category_id?: string;
  image_url?: string;
  imageUrls?: string[];
  priceDraft?: string;
};

type OrderItemRow = {
  qty: number;
  unit_price_cents: number;
  options_json: Record<string, string[]>;
  product_id: string | null;
  name_en?: string | null;
  name_es?: string | null;
  products: { name_en: string; name_es: string } | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  fulfillment: "pickup" | "delivery" | "ship";
  customer_name: string;
  customer_email: string | null;
  phone: string;
  notes: string | null;
  food_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  promo_code: string | null;
  ship_street: string | null;
  ship_city: string | null;
  ship_province: string | null;
  ship_postal: string | null;
  payment_status?: "paid" | "unpaid";
  order_items: OrderItemRow[] | null;
};

const ADMIN_TABS = [
  { id: "orders", labelEn: "Orders", labelEs: "Pedidos" },
  { id: "menu", labelEn: "Menu prices", labelEs: "Precios del menú" },
  { id: "offers", labelEn: "Weekly offers", labelEs: "Ofertas de la semana" },
  { id: "reviews", labelEn: "Reviews", labelEs: "Reseñas" },
  { id: "promos", labelEn: "Promo codes", labelEs: "Códigos de promo" },
  { id: "pages", labelEn: "Pages", labelEs: "Páginas" },
  { id: "access", labelEn: "Owner access", labelEs: "Acceso de dueña" },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]["id"];

const ORDER_STATUSES = ORDER_TAB_STATUSES;

function fulfillmentLabel(fulfillment: OrderRow["fulfillment"], lang: "en" | "es") {
  if (fulfillment === "delivery") return t("Delivery", "Entrega", lang);
  if (fulfillment === "ship") return t("Ship", "Envío", lang);
  return t("Pickup", "Recoger", lang);
}

function orderItemSummary(row: OrderRow, lang: "en" | "es") {
  return (row.order_items ?? [])
    .map((item) => {
      const name =
        lang === "es"
          ? item.name_es || item.products?.name_es
          : item.name_en || item.products?.name_en;
      return `${item.qty}× ${name || item.product_id || ""}`;
    })
    .join(", ");
}

function orderSearchHaystack(row: OrderRow): string {
  const parts: string[] = [
    row.id,
    row.customer_name,
    row.customer_email ?? "",
    row.phone,
  ];
  for (const item of row.order_items ?? []) {
    parts.push(item.name_en ?? "", item.name_es ?? "", item.products?.name_en ?? "", item.products?.name_es ?? "");
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadOrdersExcel(rows: OrderRow[]) {
  const header = [
    "Order ID",
    "Date",
    "Status",
    "Payment",
    "Fulfillment",
    "Customer",
    "Email",
    "Phone",
    "Items",
    "Food",
    "Shipping",
    "Discount",
    "Total",
    "Promo",
    "Address",
    "Notes",
  ];
  const lines = [
    header,
    ...rows.map((row) => [
      row.id,
      new Date(row.created_at).toISOString(),
      row.status,
      row.payment_status ?? "",
      row.fulfillment,
      row.customer_name,
      row.customer_email ?? "",
      row.phone,
      (row.order_items ?? [])
        .map((item) => `${item.qty}x ${item.name_en || item.products?.name_en || item.product_id || ""}`)
        .join("; "),
      dollars(row.food_cents),
      dollars(row.shipping_cents),
      dollars(row.discount_cents),
      dollars(row.total_cents),
      row.promo_code ?? "",
      [row.ship_street, row.ship_city, row.ship_province, row.ship_postal].filter(Boolean).join(", "),
      row.notes ?? "",
    ]),
  ];
  const csv = `\uFEFF${lines.map((line) => line.map((cell) => csvCell(String(cell))).join(",")).join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sweetbites-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function orderDoneCheckboxLabel(row: OrderRow, lang: "en" | "es") {
  if (row.status === "sent") return t("Shipped", "Enviado", lang);
  if (row.status === "completed") return t("Picked up", "Recogido", lang);
  return row.fulfillment === "ship"
    ? t("Mark shipped", "Marcar enviado", lang)
    : t("Mark picked up", "Marcar recogido", lang);
}

function orderRowActions(
  row: OrderRow,
  lang: "en" | "es",
  save: (id: string, status: string) => void,
) {
  if (row.status === "pending") {
    return (
      <button
        type="button"
        onClick={() => void save(row.id, "cancelled")}
        className="text-coal/50 hover:underline"
      >
        {t("Cancel", "Cancelar", lang)}
      </button>
    );
  }
  if (isMidFulfillmentStatus(row.status)) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => void save(row.id, "done")}
          className="font-medium text-berry hover:underline"
        >
          {t("Done", "Listo", lang)}
        </button>
        <button
          type="button"
          onClick={() => void save(row.id, "pending")}
          className="text-coal/50 hover:text-berry hover:underline"
        >
          {t("Back to pending", "Volver a pendiente", lang)}
        </button>
      </span>
    );
  }
  if (row.status === "done") {
    return (
      <button
        type="button"
        onClick={() => void save(row.id, reopenStatusFor(row.fulfillment))}
        className="text-coal/50 hover:underline"
      >
        {t("Reopen", "Reabrir", lang)}
      </button>
    );
  }
  if (row.status === "cancelled") {
    return (
      <button
        type="button"
        onClick={() => void save(row.id, "pending")}
        className="text-coal/50 hover:underline"
      >
        {t("Restore", "Restaurar", lang)}
      </button>
    );
  }
  return null;
}

function normalizeReviewRow(row: ReviewItem): ReviewItem {
  const quote_en = row.quote_en.trim();
  const city_en = row.city_en.trim();
  return {
    ...row,
    quote_en,
    quote_es: quote_en,
    city_en,
    city_es: city_en,
  };
}

type OfferRow = {
  id: string;
  sort: number;
  active: boolean;
  image_url: string;
  tag_en: string | null;
  tag_es: string | null;
  title_en: string;
  title_es: string;
  offer_en: string;
  offer_es: string;
  cta_href: string;
  category_id?: string;
  priceDraft?: string;
};

const emptyOffer = (): OfferRow => ({
  id: "",
  sort: 1,
  active: true,
  image_url: "/test-images/swb-banner.png",
  tag_en: "This week",
  tag_es: "Esta semana",
  title_en: "",
  title_es: "",
  offer_en: "",
  offer_es: "",
  cta_href: "/order",
  category_id: "cat-cookies",
  priceDraft: "",
});

const emptyReview = (): ReviewItem => ({
  quote_en: "",
  quote_es: "",
  reviewer_name: "",
  city_en: "",
  city_es: "",
  image_url: DEFAULT_REVIEW_IMAGE,
  active: true,
});

function linkedProduct(offer: OfferRow, products: ProductRow[]) {
  const byOfferId = products.find((p) => offer.id && p.id === `prod-${offer.id}`);
  if (byOfferId) return byOfferId;
  const slug = offer.cta_href.startsWith("/order/") ? offer.cta_href.slice("/order/".length) : "";
  return slug ? products.find((p) => p.slug === slug) : undefined;
}

function dollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function toCents(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function slugify(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const OFFER_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function uploadAdminImage(file: File) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error("Supabase is not configured");
  const ext = OFFER_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Use a JPG, PNG, WebP, or GIF");
  if (file.size > 8 * 1024 * 1024) throw new Error("Keep the image under 8 MB");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("offer-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("offer-images").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Upload failed");
  return data.publicUrl;
}

type CategoryRow = { id: string; name_en: string; name_es: string };

export function AdminClient() {
  const { lang } = useLang();
  const { user, profile, loading, configured } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: AdminTab = ADMIN_TABS.some((item) => item.id === tabParam)
    ? (tabParam as AdminTab)
    : "orders";
  const [orderFilter, setOrderFilter] = useState<OrderTabStatus>("pending");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(() => new Set());
  const selectAllOrdersRef = useRef<HTMLInputElement>(null);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameEs, setNewNameEs] = useState("");
  const [newCat, setNewCat] = useState("cat-cookies");
  const [newPrice, setNewPrice] = useState("");
  const [newImage, setNewImage] = useState("/test-images/swb-banner.png");
  const [newDescEn, setNewDescEn] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [eraseArmed, setEraseArmed] = useState(false);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [draftReview, setDraftReview] = useState<ReviewItem>(emptyReview);
  const [status, setStatus] = useState("");
  const [grantEmail, setGrantEmail] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newKind, setNewKind] = useState<PromoKind>("percent");
  const [newValue, setNewValue] = useState("10");
  const [newMin, setNewMin] = useState("0");
  const [editingPromoIdx, setEditingPromoIdx] = useState<number | null>(null);
  const [editingPromoOriginal, setEditingPromoOriginal] = useState<string | null>(null);
  const [pageSlug, setPageSlug] = useState<SitePageSlug>("about");
  const [pageBody, setPageBody] = useState<Record<string, unknown>>(SITE_PAGE_DEFAULTS.about);

  const [draftOffer, setDraftOffer] = useState<OfferRow>(emptyOffer);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const [{ data: promoData }, { data: offerData }, { data: reviewPage }, { data: productData }, { data: orderData }, { data: catData }] =
      await Promise.all([
        supabase.from("promo_codes").select("*").order("code"),
        supabase.from("weekly_offers").select("*").order("sort"),
        supabase.from("site_pages").select("body").eq("slug", "reviews").maybeSingle(),
        supabase.from("products").select("id, name_en, name_es, slug, price_cents, active, category_id, image_url").order("name_en"),
        supabase
          .from("orders")
          .select(
            "id, created_at, status, fulfillment, customer_name, customer_email, phone, notes, food_cents, shipping_cents, discount_cents, total_cents, promo_code, payment_status, ship_street, ship_city, ship_province, ship_postal, order_items ( qty, unit_price_cents, options_json, product_id, name_en, name_es, products ( name_en, name_es ) )",
          )
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("categories").select("id, name_en, name_es").order("sort"),
      ]);
    const productRows = ((productData as ProductRow[]) ?? []).map((row) => ({
      ...row,
      imageUrls: parseProductImages(row.image_url),
    }));
    setPromos((promoData as PromoRow[]) ?? []);
    setProducts(productRows);
    const savedReviews = (reviewPage?.body as { items?: ReviewItem[] } | null)?.items;
    setReviews(savedReviews?.length ? savedReviews : FALLBACK_REVIEW_ITEMS.map((row) => ({ ...row })));
    setOffers(
      ((offerData as OfferRow[]) ?? []).map((o) => {
        const p = linkedProduct(o, productRows);
        return {
          ...o,
          priceDraft: p ? dollars(p.price_cents) : "",
          category_id: p?.category_id ?? "cat-cookies",
        };
      }),
    );
    setOrders(
      ((orderData as unknown as OrderRow[]) ?? []).map((row) =>
        row.status === "ready" ? { ...row, status: "pending" } : row,
      ),
    );
    setCategories((catData as CategoryRow[]) ?? []);
    if (catData?.[0]?.id) setNewCat((c) => c || catData[0].id);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") void load();
  }, [profile?.role, load]);

  useEffect(() => {
    setSelectedOrderIds(new Set());
    setOrderSearch("");
  }, [orderFilter]);

  const visibleOrderIds = orders
    .filter((row) => row.status === orderFilter)
    .map((row) => row.id);
  const selectedVisibleCount = visibleOrderIds.filter((id) => selectedOrderIds.has(id)).length;
  const allVisibleSelected =
    visibleOrderIds.length > 0 && selectedVisibleCount === visibleOrderIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    const el = selectAllOrdersRef.current;
    if (el) el.indeterminate = someVisibleSelected;
  }, [someVisibleSelected, orderFilter, visibleOrderIds.length]);

  const orderSearchQuery = orderSearch.trim().toLowerCase();
  const statusOrders = useMemo(
    () => orders.filter((row) => row.status === orderFilter),
    [orders, orderFilter],
  );
  const displayedOrders = useMemo(() => {
    if (!orderSearchQuery) return statusOrders;
    return statusOrders.filter((row) => orderSearchHaystack(row).includes(orderSearchQuery));
  }, [statusOrders, orderSearchQuery]);
  const visibleOrders = statusOrders;

  useEffect(() => {
    if (profile?.role !== "admin") return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setPageBody({ ...SITE_PAGE_DEFAULTS[pageSlug] });
    void sb
      .from("site_pages")
      .select("body")
      .eq("slug", pageSlug)
      .maybeSingle()
      .then(({ data }) => {
        const base = SITE_PAGE_DEFAULTS[pageSlug];
        const raw = data?.body;
        if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length) {
          setPageBody({ ...base, ...(raw as Record<string, unknown>) });
        } else {
          setPageBody({ ...base });
        }
      });
  }, [profile?.role, pageSlug]);

  if (loading) {
    return <p className="text-center text-coal/60">{t("Loading…", "Cargando…", lang)}</p>;
  }

  if (!configured || !user) {
    return (
      <p className="text-center text-coal/70">
        {t("Sign in with the shop owner account.", "Inicia sesión con la cuenta de la dueña.", lang)}{" "}
        <Link href="/login" className="text-berry underline">
          {t("Sign in", "Iniciar sesión", lang)}
        </Link>
      </p>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <p className="text-center text-coal/70">
        {t("This page is for the shop owner.", "Esta página es para la dueña de la tienda.", lang)}
      </p>
    );
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const flash = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(""), 2500);
  };

  const savePromo = async (row: PromoRow, isNew = false, originalCode?: string) => {
    const payload = {
      code: row.code.trim().toUpperCase(),
      kind: row.kind,
      value: row.kind === "percent" ? Math.round(Number(row.value)) : row.value,
      min_food_cents: row.min_food_cents,
      active: row.active,
      expires_at: row.expires_at,
    };
    if (!payload.code || payload.value <= 0) {
      flash(t("Code and value are required", "Código y valor son obligatorios", lang));
      return;
    }
    const prevCode = (originalCode ?? row.code).trim().toUpperCase();
    let error = null as { message: string } | null;
    if (isNew) {
      ({ error } = await supabase.from("promo_codes").insert(payload));
    } else if (prevCode !== payload.code) {
      ({ error } = await supabase.from("promo_codes").delete().eq("code", prevCode));
      if (!error) ({ error } = await supabase.from("promo_codes").insert(payload));
    } else {
      ({ error } = await supabase.from("promo_codes").update(payload).eq("code", prevCode));
    }
    if (error) {
      flash(error.message);
      return;
    }
    flash(t("Saved", "Guardado", lang));
    setEditingPromoIdx(null);
    setEditingPromoOriginal(null);
    if (isNew) {
      setNewCode("");
      setNewValue("10");
      setNewMin("0");
    }
    await load();
  };

  const deletePromo = async (code: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("code", code);
    if (error) flash(error.message);
    else {
      flash(t("Deleted", "Eliminado", lang));
      await load();
    }
  };

  const saveOffer = async (row: OfferRow, isNew = false) => {
    const id = slugify(row.id || row.title_en);
    if (!id || !row.title_en.trim() || !row.image_url.trim()) {
      flash(t("Title and image URL are required", "Título y URL de imagen son obligatorios", lang));
      return;
    }
    const name_en = row.title_en.trim();
    const name_es = row.title_es.trim() || name_en;
    const price_cents = toCents(row.priceDraft ?? "");
    let cta_href = "/order";
    if (price_cents > 0) {
      const slug = slugify(name_en) || id;
      const existing =
        products.find((p) => p.id === `prod-${id}`) ??
        products.find((p) => p.slug === slug) ??
        (row.cta_href.startsWith("/order/") ? products.find((p) => `/order/${p.slug}` === row.cta_href) : undefined);
      const { error: prodError } = existing
        ? await supabase
            .from("products")
            .update({
              name_en,
              name_es,
              description_en: row.offer_en.trim() || name_en,
              description_es: row.offer_es.trim() || name_es,
              price_cents,
              image_url: row.image_url.trim(),
              category_id: row.category_id || existing.category_id || "cat-cookies",
              active: true,
            })
            .eq("id", existing.id)
        : await supabase.from("products").insert({
            id: `prod-${id}`,
            category_id: row.category_id || "cat-cookies",
            name_en,
            name_es,
            slug,
            description_en: row.offer_en.trim() || name_en,
            description_es: row.offer_es.trim() || name_es,
            price_cents,
            image_url: row.image_url.trim(),
            // ponytail: cookie-size ship dims; add fields if a special needs custom packing
            lead_days: 0,
            ship_weight_g: 120,
            ship_l_cm: 15,
            ship_w_cm: 15,
            ship_h_cm: 5,
            active: true,
          });
      if (prodError) {
        flash(prodError.message);
        return;
      }
      cta_href = `/order/${existing?.slug ?? slug}`;
    }
    const payload = {
      id,
      sort: row.sort,
      active: row.active,
      image_url: row.image_url,
      tag_en: row.tag_en,
      tag_es: row.tag_es,
      title_en: row.title_en,
      title_es: row.title_es,
      offer_en: row.offer_en,
      offer_es: row.offer_es,
      cta_href,
    };
    const { error } = isNew
      ? await supabase.from("weekly_offers").insert(payload)
      : await supabase.from("weekly_offers").update(payload).eq("id", row.id);
    if (error) {
      flash(error.message);
      return;
    }
    flash(t("Saved", "Guardado", lang));
    if (isNew) setDraftOffer(emptyOffer());
    await load();
  };

  const writeReviews = async (items: ReviewItem[]) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const normalized = items.map(normalizeReviewRow);
    const { error } = await supabase.from("site_pages").upsert({
      slug: "reviews",
      body: { items: normalized },
      updated_at: new Date().toISOString(),
    });
    if (error) {
      flash(error.message);
      return;
    }
    setReviews(normalized);
    flash(t("Saved", "Guardado", lang));
  };

  const saveReview = async (index: number, row: ReviewItem) => {
    if (!row.quote_en.trim() || !row.reviewer_name.trim()) {
      flash(t("Quote and name are required", "Quote and name are required", lang));
      return;
    }
    const next = reviews.map((item, i) => (i === index ? normalizeReviewRow(row) : item));
    await writeReviews(next);
  };

  const addReview = async (row: ReviewItem) => {
    if (!row.quote_en.trim() || !row.reviewer_name.trim()) {
      flash(t("Quote and name are required", "Quote and name are required", lang));
      return;
    }
    await writeReviews([...reviews, normalizeReviewRow(row)]);
    setDraftReview(emptyReview());
  };

  const deleteReview = async (index: number) => {
    await writeReviews(reviews.filter((_, i) => i !== index));
  };

  const deleteOffer = async (id: string) => {
    if (!id) return;
    const { error } = await supabase.from("weekly_offers").delete().eq("id", id);
    if (error) flash(error.message);
    else {
      flash(t("Deleted", "Eliminado", lang));
      await load();
    }
  };

  const grantAdmin = async () => {
    const email = grantEmail.trim();
    if (!email) return;
    const { error } = await supabase.rpc("grant_admin", { target_email: email });
    if (error) {
      flash(error.message);
      return;
    }
    setGrantEmail("");
    flash(t("Admin access saved. They get it on next sign-in if the account is new.", "Acceso de admin guardado. Si la cuenta es nueva, lo recibe al iniciar sesión.", lang));
  };

  const saveProduct = async (row: ProductRow) => {
    const price_cents = toCents(row.priceDraft ?? dollars(row.price_cents));
    const image_url = serializeProductImages(row.imageUrls ?? parseProductImages(row.image_url));
    const { error } = await supabase
      .from("products")
      .update({ price_cents, active: row.active, image_url })
      .eq("id", row.id);
    if (error) {
      flash(error.message);
      return;
    }
    setProducts((rows) =>
      rows.map((r) =>
        r.id === row.id
          ? { ...r, price_cents, image_url, imageUrls: parseProductImages(image_url), priceDraft: undefined }
          : r,
      ),
    );
    flash(t("Saved", "Guardado", lang));
  };

  const uploadProductImage = async (row: ProductRow, file: File, replaceIndex?: number) => {
    try {
      const url = await uploadAdminImage(file);
      setProducts((rows) =>
        rows.map((r) => {
          if (r.id !== row.id) return r;
          const prev = r.imageUrls ?? parseProductImages(r.image_url);
          let imageUrls: string[];
          if (replaceIndex !== undefined && replaceIndex >= 0) {
            imageUrls = [...prev];
            imageUrls[replaceIndex] = url;
          } else {
            imageUrls = [...prev, url];
          }
          return { ...r, imageUrls, image_url: serializeProductImages(imageUrls) };
        }),
      );
    } catch (err) {
      flash(err instanceof Error ? err.message : t("Upload failed", "No se pudo subir", lang));
    }
  };

  const removeProductImage = (row: ProductRow, index: number) => {
    setProducts((rows) =>
      rows.map((r) => {
        if (r.id !== row.id) return r;
        const imageUrls = (r.imageUrls ?? parseProductImages(r.image_url)).filter((_, i) => i !== index);
        return { ...r, imageUrls, image_url: serializeProductImages(imageUrls) };
      }),
    );
  };

  const saveSitePage = async () => {
    const { error } = await supabase.from("site_pages").upsert({
      slug: pageSlug,
      body: pageBody,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      flash(error.message);
      return;
    }
    flash(t("Saved", "Guardado", lang));
  };

  const deleteProduct = async (id: string) => {
    if (!id) return;
    const { data, error } = await supabase.from("products").delete().eq("id", id).select("id");
    if (error) {
      flash(
        error.code === "23503" || /foreign key/i.test(error.message)
          ? t(
              "This product is on an order. Uncheck On menu to hide it.",
              "Este producto está en un pedido. Desmarca En menú para ocultarlo.",
              lang,
            )
          : error.message,
      );
      return;
    }
    if (!data?.length) {
      flash(t("Couldn’t delete that product.", "No se pudo borrar ese producto.", lang));
      return;
    }
    setProducts((rows) => rows.filter((r) => r.id !== id));
    flash(t("Deleted", "Eliminado", lang));
  };

  const addProduct = async () => {
    const name_en = newNameEn.trim();
    const name_es = newNameEs.trim() || name_en;
    const slug = slugify(name_en);
    const price_cents = toCents(newPrice);
    const description_en = newDescEn.trim() || name_en;
    if (!name_en || !slug) {
      flash(t("Name is required", "El nombre es obligatorio", lang));
      return;
    }
    if (price_cents <= 0) {
      flash(t("Enter a price", "Ingresa un precio", lang));
      return;
    }
    const { error } = await supabase.from("products").insert({
      id: `prod-${slug}`,
      category_id: newCat,
      name_en,
      name_es,
      slug,
      description_en,
      description_es: name_es,
      price_cents,
      image_url: newImage.trim() || "/test-images/swb-banner.png",
      // ponytail: cookie-size ship dims; add fields if a product needs custom packing
      lead_days: 0,
      ship_weight_g: 120,
      ship_l_cm: 15,
      ship_w_cm: 15,
      ship_h_cm: 5,
      active: true,
    });
    if (error) {
      flash(error.message);
      return;
    }
    setNewNameEn("");
    setNewNameEs("");
    setNewPrice("");
    setNewDescEn("");
    await load();
    flash(t("Product added", "Producto agregado", lang));
  };

  const saveOrderStatus = async (id: string, next: string) => {
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
    if (error) {
      flash(error.message);
      return;
    }
    setOrders((rows) => rows.map((r) => (r.id === id ? { ...r, status: next } : r)));
    flash(t("Saved", "Guardado", lang));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedOrderIds(new Set());
      return;
    }
    setSelectedOrderIds(new Set(visibleOrderIds));
  };

  const toggleOrderSelected = (id: string, checked: boolean) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const bulkUpdateOrderStatuses = async (
    rows: OrderRow[],
    nextForRow: (row: OrderRow) => string,
  ) => {
    if (!rows.length) return;

    const byStatus = new Map<string, string[]>();
    for (const row of rows) {
      const next = nextForRow(row);
      const ids = byStatus.get(next) ?? [];
      ids.push(row.id);
      byStatus.set(next, ids);
    }

    const applied: { id: string; status: string }[] = [];
    for (const [next, ids] of byStatus) {
      const { error } = await supabase.from("orders").update({ status: next }).in("id", ids);
      if (error) {
        flash(error.message);
        if (applied.length) {
          setOrders((rows) =>
            rows.map((r) => {
              const hit = applied.find((a) => a.id === r.id);
              return hit ? { ...r, status: hit.status } : r;
            }),
          );
          await load();
        }
        return;
      }
      for (const id of ids) applied.push({ id, status: next });
    }

    setOrders((rows) =>
      rows.map((r) => {
        const hit = applied.find((a) => a.id === r.id);
        return hit ? { ...r, status: hit.status } : r;
      }),
    );
    flash(t("Saved", "Guardado", lang));
  };

  const bulkApplySelected = async () => {
    const selected = orders.filter((row) => row.status === orderFilter && selectedOrderIds.has(row.id));
    await bulkUpdateOrderStatuses(selected, (row) => bulkStatusForOrder(orderFilter, row.fulfillment));
    setSelectedOrderIds(new Set());
  };

  const bulkFulfillAllVisiblePending = async () => {
    const pending = orders.filter((row) => row.status === "pending");
    await bulkUpdateOrderStatuses(pending, (row) => fulfilledStatusFor(row.fulfillment));
  };

  const downloadVisibleOrders = () => {
    if (!visibleOrders.length) return;
    downloadOrdersExcel(visibleOrders);
    flash(t("Excel file downloaded. Erase only after you have the file.", "Archivo de Excel descargado. Borra solo cuando ya tengas el archivo.", lang));
  };

  const eraseVisibleOrders = async () => {
    if (!canEraseOrdersTab(orderFilter) || !visibleOrders.length) return;
    if (!eraseArmed) {
      setEraseArmed(true);
      flash(t("Click erase again to permanently delete this list.", "Haz clic otra vez para borrar esta lista para siempre.", lang));
      return;
    }
    const ids = visibleOrders.map((row) => row.id);
    const { error } = await supabase.from("orders").delete().in("id", ids);
    setEraseArmed(false);
    if (error) {
      flash(error.message);
      return;
    }
    setOrders((rows) => rows.filter((row) => !ids.includes(row.id)));
    flash(t("Orders deleted.", "Pedidos borrados.", lang));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-berry">{t("Shop admin", "Admin de la tienda", lang)}</h1>
        <p className="mt-1 text-sm text-coal/70">
          {t("Orders, menu prices, weekly banners, reviews, and promo codes.", "Pedidos, precios del menú, banners de la semana, reseñas y códigos de promo.", lang)}
        </p>
        {status && <p className="mt-2 text-sm text-berry">{status}</p>}
        <nav className="mt-6 flex flex-wrap gap-2" aria-label={t("Admin sections", "Secciones de admin", lang)}>
          {ADMIN_TABS.map((item) => (
            <Link
              key={item.id}
              href={`/admin?tab=${item.id}`}
              scroll={false}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id ? "bg-berry text-white" : "bg-blush/40 text-coal/80 hover:bg-blush/70"
              }`}
            >
              {lang === "es" ? item.labelEs : item.labelEn}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "orders" && (
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => {
            const count = orders.filter((row) => row.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setOrderFilter(s);
                  setEraseArmed(false);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                  orderFilter === s ? "bg-coal text-white" : "bg-white text-coal/70 shadow-sm hover:bg-blush/40"
                }`}
              >
                {customerOrderStatusLabel(s, lang)}
                {count ? ` ${count}` : ""}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          placeholder={t("Search orders", "Buscar pedidos", lang)}
          className={`${inputClass} max-w-md`}
        />
        {visibleOrders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadVisibleOrders}
              className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-coal shadow-sm hover:bg-blush/40"
            >
              {t("Download Excel", "Descargar Excel", lang)}
            </button>
            {orderFilter !== "pending" ? (
              <button
                type="button"
                disabled={selectedVisibleCount === 0}
                onClick={() => void bulkApplySelected()}
                className="rounded-xl bg-berry px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkOrderActionLabel(orderFilter, lang)} ({selectedVisibleCount})
              </button>
            ) : null}
            {canEraseOrdersTab(orderFilter) ? (
              <button
                type="button"
                onClick={() => void eraseVisibleOrders()}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  eraseArmed ? "bg-berry text-white" : "bg-white text-coal shadow-sm hover:bg-blush/40"
                }`}
              >
                {eraseArmed
                  ? t("Click again to erase forever", "Haz clic otra vez para borrar para siempre", lang)
                  : t("Erase these orders", "Borrar estos pedidos", lang)}
              </button>
            ) : (
              <p className="text-xs text-coal/50">
                {t(
                  "Mark orders done first. Download Excel, then erase from Picked up, Shipped, Done, or Cancelled.",
                  "Marca los pedidos como hechos. Descarga Excel y luego borra desde Recogido, Enviado, Listo o Cancelado.",
                  lang,
                )}
              </p>
            )}
          </div>
        )}
        {displayedOrders.length === 0 ? (
          <p className="text-sm text-coal/60">
            {orders.length === 0
              ? t("No orders yet.", "Aún no hay pedidos.", lang)
              : orderSearchQuery
                ? t("No orders match your search.", "Ningún pedido coincide con la búsqueda.", lang)
                : t("No orders in this list.", "No hay pedidos en esta lista.", lang)}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
            <table className="w-full min-w-0 text-left text-sm md:min-w-[720px]">
              <thead>
                <tr className="text-coal/60">
                  <th className="pb-2 pr-2 w-8">
                    <input
                      ref={selectAllOrdersRef}
                      type="checkbox"
                      checked={orderFilter === "pending" ? false : allVisibleSelected}
                      aria-label={
                        orderFilter === "pending"
                          ? t("Mark all", "Marcar todos", lang)
                          : t("Select all", "Seleccionar todo", lang)
                      }
                      onChange={(e) => {
                        if (orderFilter === "pending") {
                          if (e.target.checked) void bulkFulfillAllVisiblePending();
                          return;
                        }
                        toggleSelectAllVisible();
                      }}
                    />
                  </th>
                  <th className="pb-2 pr-2">{t("Order", "Pedido", lang)}</th>
                  <th className="pb-2 pr-2">{t("Customer", "Cliente", lang)}</th>
                  <th className="pb-2 pr-2">{t("Items", "Artículos", lang)}</th>
                  <th className="pb-2 pr-2">{t("Total", "Total", lang)}</th>
                  <th className="hidden pb-2 pr-2 md:table-cell">{t("Type", "Tipo", lang)}</th>
                  <th className="hidden pb-2 pr-2 md:table-cell">{t("Date", "Fecha", lang)}</th>
                  <th className="hidden pb-2 md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((row) => {
                  const open = openOrderId === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-blush/40">
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={orderFilter === "pending" ? false : selectedOrderIds.has(row.id)}
                            aria-label={
                              orderFilter === "pending"
                                ? orderDoneCheckboxLabel(row, lang)
                                : t("Select order", "Seleccionar pedido", lang)
                            }
                            onChange={(e) => {
                              if (orderFilter === "pending") {
                                if (e.target.checked) {
                                  void saveOrderStatus(row.id, fulfilledStatusFor(row.fulfillment));
                                }
                                return;
                              }
                              toggleOrderSelected(row.id, e.target.checked);
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <div className="whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setOpenOrderId(open ? null : row.id)}
                              className="font-medium text-berry hover:underline"
                            >
                              #{row.id.slice(0, 8)}
                            </button>
                            {row.payment_status === "unpaid" ? (
                              <span className="ml-2 text-berry">{t("Unpaid", "Sin pagar", lang)}</span>
                            ) : null}
                          </div>
                          <div className="mt-1 md:hidden">
                            {orderRowActions(row, lang, (id, status) => void saveOrderStatus(id, status))}
                          </div>
                        </td>
                        <td className="py-2 pr-2">{row.customer_name}</td>
                        <td className="py-2 pr-2 max-w-[220px] truncate" title={orderItemSummary(row, lang)}>
                          {orderItemSummary(row, lang) || "—"}
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap font-medium text-berry">
                          {formatCad(row.total_cents)}
                        </td>
                        <td className="hidden py-2 pr-2 md:table-cell">{fulfillmentLabel(row.fulfillment, lang)}</td>
                        <td className="hidden py-2 pr-2 whitespace-nowrap text-coal/60 md:table-cell">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="hidden py-2 whitespace-nowrap md:table-cell">
                          {orderRowActions(row, lang, (id, status) => void saveOrderStatus(id, status))}
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-t border-blush/20 bg-blush/20">
                          <td colSpan={8} className="space-y-2 px-2 py-3 text-sm">
                            <p>
                              {row.customer_email || "—"} · {row.phone}
                            </p>
                            {(row.ship_street || row.ship_city) && (
                              <p className="text-coal/70">
                                {[row.ship_street, row.ship_city, row.ship_province, row.ship_postal]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                            {row.notes && <p className="text-coal/70">{row.notes}</p>}
                            <ul className="space-y-1">
                              {(row.order_items ?? []).map((item, i) => {
                                const name =
                                  lang === "es"
                                    ? item.name_es || item.products?.name_es
                                    : item.name_en || item.products?.name_en;
                                return (
                                  <li key={`${row.id}-${i}`}>
                                    {item.qty}× {name || item.product_id} —{" "}
                                    {formatCad(item.unit_price_cents * item.qty)}
                                  </li>
                                );
                              })}
                            </ul>
                            {row.promo_code && (
                              <p className="text-berry">
                                {row.promo_code} −{formatCad(row.discount_cents)}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {tab === "menu" && (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("Menu prices", "Precios del menú", lang)}</h2>
        <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="text-coal/60">
                <th className="px-3 pb-2">{t("Product", "Producto", lang)}</th>
                <th className="pb-2">{t("Image", "Imagen", lang)}</th>
                <th className="pb-2">{t("Price $", "Precio $", lang)}</th>
                <th className="pb-2">{t("On menu", "En menú", lang)}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {(() => {
                const categoryIds = new Set(categories.map((c) => c.id));
                const otherProducts = products.filter(
                  (p) => !p.category_id || !categoryIds.has(p.category_id),
                );
                const menuGroups = [
                  ...categories
                    .map((cat) => ({
                      key: cat.id,
                      title: lang === "es" ? cat.name_es : cat.name_en,
                      products: products.filter((p) => p.category_id === cat.id),
                    }))
                    .filter((g) => g.products.length > 0),
                  ...(otherProducts.length
                    ? [{ key: "other", title: t("Other", "Otros", lang), products: otherProducts }]
                    : []),
                ];
                return menuGroups.map((group) => (
                  <Fragment key={group.key}>
                    <tr className="border-t border-blush/60 bg-blush/25">
                      <td colSpan={5} className="px-3 py-2 font-display text-sm uppercase tracking-wide text-berry">
                        {group.title}
                      </td>
                    </tr>
                    {group.products.map((row) => (
                <tr key={row.id} className="border-t border-blush/40">
                  <td className="px-3 py-2">
                    <p className="font-medium">{lang === "es" ? row.name_es : row.name_en}</p>
                    {lang === "es" ? <p className="text-xs text-coal/50">{row.name_en}</p> : null}
                  </td>
                  <td className="py-2">
                    <div className="flex max-w-[200px] flex-wrap gap-1">
                      {(row.imageUrls ?? parseProductImages(row.image_url)).map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative">
                          <img src={url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          <button
                            type="button"
                            title={t("Remove", "Remove", lang)}
                            onClick={() => removeProductImage(row, idx)}
                            className="absolute -right-1 -top-1 rounded-full bg-coal/80 px-1 text-[10px] text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="mt-1 max-w-[140px] text-xs file:mr-1 file:rounded file:border-0 file:bg-blush/50 file:px-2 file:py-1 file:text-xs"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void uploadProductImage(row, file);
                      }}
                    />
                    <p className="mt-0.5 text-[10px] text-coal/50">{t("Save to apply", "Guardar para aplicar", lang)}</p>
                  </td>
                  <td className="py-2">
                    <input
                      inputMode="decimal"
                      value={row.priceDraft ?? dollars(row.price_cents)}
                      onChange={(e) =>
                        setProducts((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, priceDraft: e.target.value } : r)),
                        )
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) =>
                        setProducts((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, active: e.target.checked } : r)),
                        )
                      }
                    />
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <button type="button" onClick={() => saveProduct(row)} className="text-berry hover:underline">
                      {t("Save", "Guardar", lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(row.id)}
                      className="ml-3 text-coal/50 hover:underline"
                    >
                      {t("Delete", "Borrar", lang)}
                    </button>
                  </td>
                </tr>
                    ))}
                  </Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-coal/50">
          {t(
            "These prices show on the menu, product pages, and home top sellers. Uncheck On menu to hide an item.",
            "Estos precios se ven en el menú, las fichas y los más vendidos. Desmarca En menú para ocultar un producto.",
            lang,
          )}
        </p>
        <div className="space-y-2 rounded-2xl border border-dashed border-blush bg-white p-4">
          <p className="text-sm font-medium">{t("Add product", "Agregar producto", lang)}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={newNameEn}
              onChange={(e) => setNewNameEn(e.target.value)}
              placeholder={t("Name (EN)", "Nombre (EN)", lang)}
              className={inputClass}
            />
            <input
              value={newNameEs}
              onChange={(e) => setNewNameEs(e.target.value)}
              placeholder={t("Name (ES, optional)", "Nombre (ES, opcional)", lang)}
              className={inputClass}
            />
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "es" ? c.name_es : c.name_en}
                </option>
              ))}
            </select>
            <input
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder={t("Price $", "Precio $", lang)}
              className={inputClass}
            />
            <div className="space-y-2 sm:col-span-2">
              <input
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="Image URL or /test-images/…"
                className={inputClass}
              />
              <label className="flex flex-wrap items-center gap-3 text-sm text-coal/70">
                <span className="shrink-0 font-medium text-berry">
                  {t("Or upload from this computer", "O sube desde esta computadora", lang)}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blush/50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-coal"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    void uploadAdminImage(file)
                      .then((url) => setNewImage(url))
                      .catch((err) =>
                        flash(err instanceof Error ? err.message : t("Upload failed", "No se pudo subir", lang)),
                      );
                  }}
                />
              </label>
              {newImage ? <img src={newImage} alt="" className="h-20 rounded-lg object-cover" /> : null}
            </div>
            <input
              value={newDescEn}
              onChange={(e) => setNewDescEn(e.target.value)}
              placeholder={t("Short description (optional)", "Descripción corta (opcional)", lang)}
              className={`${inputClass} sm:col-span-2`}
            />
          </div>
          <button type="button" onClick={addProduct} className="rounded-xl bg-berry px-4 py-2 text-sm font-medium text-white">
            {t("Add product", "Agregar producto", lang)}
          </button>
        </div>
      </section>
      )}

      {tab === "offers" && (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("Weekly offers", "Ofertas de la semana", lang)}</h2>
        {offers.map((offer) => (
          <OfferForm
            key={offer.id}
            offer={offer}
            categories={categories}
            lang={lang}
            onChange={(next) => setOffers((rows) => rows.map((r) => (r.id === offer.id ? next : r)))}
            onSave={(row) => saveOffer(row)}
            onDelete={() => deleteOffer(offer.id)}
          />
        ))}
        <div className="rounded-2xl border border-dashed border-blush bg-white p-4">
          <p className="mb-3 text-sm font-medium">{t("Add offer", "Agregar oferta", lang)}</p>
          <OfferForm
            offer={draftOffer}
            categories={categories}
            lang={lang}
            onChange={setDraftOffer}
            onSave={(row) => saveOffer(row, true)}
          />
        </div>
        <p className="text-xs text-coal/50">
          {t(
            "A price puts this on the menu and sends Order now to that product. Leave price empty to send people to the whole menu.",
            "Un precio lo pone en el menú y Pedir ahora lleva a ese producto. Sin precio, lleva a todo el menú.",
            lang,
          )}
        </p>
      </section>
      )}

      {tab === "reviews" && (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("Reviews", "Reseñas", lang)}</h2>
        {reviews.map((row, index) => (
          <ReviewForm
            key={`${row.reviewer_name}-${index}`}
            review={row}
            onChange={(next) => setReviews((rows) => rows.map((r, i) => (i === index ? next : r)))}
            onSave={() => saveReview(index, reviews[index] ?? row)}
            onDelete={() => deleteReview(index)}
          />
        ))}
        <div className="rounded-2xl border border-dashed border-blush bg-white p-4">
          <p className="mb-3 text-sm font-medium">{t("Add review", "Agregar reseña", lang)}</p>
          <ReviewForm
            review={draftReview}
            onChange={setDraftReview}
            onSave={() => addReview(draftReview)}
          />
        </div>
      </section>
      )}

      {tab === "promos" && (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("Promo codes", "Códigos de promo", lang)}</h2>
        <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-coal/60">
                <th className="pb-2">{t("Code", "Código", lang)}</th>
                <th className="pb-2">{t("Type", "Tipo", lang)}</th>
                <th className="pb-2">{t("Value", "Valor", lang)}</th>
                <th className="pb-2">{t("Min food", "Mín. comida", lang)}</th>
                <th className="pb-2">{t("Active", "Activo", lang)}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {promos.map((row, idx) => {
                const editing = editingPromoIdx === idx;
                return (
                <tr key={`${row.code}-${idx}`} className="border-t border-blush/40">
                  <td className="py-2">
                    {editing ? (
                      <input
                        value={row.code}
                        onChange={(e) =>
                          setPromos((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, code: e.target.value.toUpperCase() } : r)),
                          )
                        }
                        className={`${inputClass} uppercase`}
                      />
                    ) : (
                      <span className="font-medium">{row.code}</span>
                    )}
                  </td>
                  <td className="py-2">
                    <select
                      value={row.kind}
                      disabled={!editing}
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, kind: e.target.value as PromoKind } : r)),
                        )
                      }
                      className={inputClass}
                    >
                      <option value="percent">%</option>
                      <option value="fixed">$</option>
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      value={row.kind === "percent" ? String(row.value) : dollars(row.value)}
                      disabled={!editing}
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  value: r.kind === "percent" ? Number(e.target.value) || 0 : toCents(e.target.value),
                                }
                              : r,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      value={dollars(row.min_food_cents)}
                      disabled={!editing}
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, min_food_cents: toCents(e.target.value) } : r)),
                        )
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={row.active}
                      disabled={!editing}
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, active: e.target.checked } : r)),
                        )
                      }
                    />
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    {editing ? (
                      <button
                        type="button"
                        onClick={() => savePromo(row, false, editingPromoOriginal ?? row.code)}
                        className="text-berry hover:underline"
                      >
                        {t("Save", "Guardar", lang)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPromoIdx(idx);
                          setEditingPromoOriginal(row.code);
                        }}
                        className="text-berry hover:underline"
                      >
                        {t("Modify", "Modificar", lang)}
                      </button>
                    )}
                    {" · "}
                    <button type="button" onClick={() => deletePromo(row.code)} className="text-coal/50 hover:underline">
                      {t("Delete", "Borrar", lang)}
                    </button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-5">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder={t("NEWCODE", "CODIGO", lang)}
            className={`${inputClass} uppercase`}
          />
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as PromoKind)} className={inputClass}>
            <option value="percent">%</option>
            <option value="fixed">$</option>
          </select>
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="10" className={inputClass} />
          <input value={newMin} onChange={(e) => setNewMin(e.target.value)} placeholder="0.00" className={inputClass} />
          <button
            type="button"
            onClick={() =>
              savePromo(
                {
                  code: newCode,
                  kind: newKind,
                  value: newKind === "percent" ? Number(newValue) || 0 : toCents(newValue),
                  min_food_cents: toCents(newMin),
                  active: true,
                  expires_at: null,
                },
                true,
              )
            }
            className="rounded-xl bg-berry px-4 py-2 text-sm font-medium text-white"
          >
            {t("Add code", "Agregar código", lang)}
          </button>
        </div>
        <p className="text-xs text-coal/50">
          {t("% is off food (10 = 10%). $ is dollars off. Min food is the cart subtotal needed.", "% es descuento en comida (10 = 10%). $ es dólares de descuento. Mín. comida es el subtotal requerido.", lang)}
        </p>
      </section>
      )}

      {tab === "pages" && (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("Site pages", "Páginas del sitio", lang)}</h2>
        <select
          value={pageSlug}
          onChange={(e) => setPageSlug(e.target.value as SitePageSlug)}
          className={inputClass}
        >
          {SITE_PAGE_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {sitePageTabLabel(slug, lang)}
            </option>
          ))}
        </select>
        <SitePageEditor slug={pageSlug} body={pageBody} lang={lang} onChange={setPageBody} />
        <button type="button" onClick={() => void saveSitePage()} className="rounded-xl bg-berry px-4 py-2 text-sm font-medium text-white">
          {t("Save page", "Guardar página", lang)}
        </button>
      </section>
      )}

      {tab === "access" && (
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{t("Owner access", "Acceso de dueña", lang)}</h2>
        <p className="text-sm text-coal/70">
          {t("Add the client’s email so she can open this page after she creates an account.", "Agrega el correo de la clienta para que abra esta página cuando cree su cuenta.", lang)}
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="owner@email.com"
            className={inputClass}
          />
          <button type="button" onClick={grantAdmin} className="shrink-0 rounded-xl bg-berry px-4 py-2 text-sm font-medium text-white">
            {t("Make admin", "Hacer admin", lang)}
          </button>
        </div>
      </section>
      )}
    </div>
  );
}

function SitePageEditor({
  slug,
  body,
  lang,
  onChange,
}: {
  slug: SitePageSlug;
  body: Record<string, unknown>;
  lang: "en" | "es";
  onChange: (next: Record<string, unknown>) => void;
}) {
  const set = (patch: Record<string, unknown>) => onChange({ ...body, ...patch });
  const str = (key: string) => String(body[key] ?? "");
  const [uploadMsg, setUploadMsg] = useState("");

  if (slug === "about") {
    return (
      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={str("photo_url")}
          onChange={(e) => {
            setUploadMsg("");
            set({ photo_url: e.target.value });
          }}
          placeholder="Photo URL"
          className={inputClass}
        />
        <label className="flex flex-wrap items-center gap-3 text-sm text-coal/70">
          <span className="shrink-0 font-medium text-berry">
            {t("Or upload from this computer", "O sube desde esta computadora", lang)}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blush/50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-coal"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUploadMsg("");
              void uploadAdminImage(file)
                .then((url) => set({ photo_url: url }))
                .catch((err) =>
                  setUploadMsg(err instanceof Error ? err.message : t("Upload failed", "No se pudo subir", lang)),
                );
            }}
          />
        </label>
        {uploadMsg ? <p className="text-sm text-berry">{uploadMsg}</p> : null}
        {str("photo_url") ? <img src={str("photo_url")} alt="" className="h-20 rounded-lg object-cover" /> : null}
        <textarea
          value={str("p1_en")}
          onChange={(e) => set({ p1_en: e.target.value, p1_es: e.target.value })}
          placeholder="Paragraph 1"
          className={inputClass}
          rows={3}
        />
        <textarea
          value={str("p2_en")}
          onChange={(e) => set({ p2_en: e.target.value, p2_es: e.target.value })}
          placeholder="Paragraph 2"
          className={inputClass}
          rows={3}
        />
      </div>
    );
  }

  if (slug === "faq") {
    const items = (body.items as { qEn: string; qEs: string; aEn: string; aEs: string }[]) ?? [];
    const setItems = (next: typeof items) => set({ items: next });
    return (
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        {items.map((item, i) => (
          <div key={i} className="space-y-2 border-t border-blush/40 pt-3 first:border-0 first:pt-0">
            <input
              value={item.qEn}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, qEn: e.target.value, qEs: e.target.value } : x)))
              }
              placeholder="Question"
              className={inputClass}
            />
            <textarea
              value={item.aEn}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, aEn: e.target.value, aEs: e.target.value } : x)))
              }
              placeholder="Answer"
              className={inputClass}
              rows={2}
            />
            <button type="button" className="text-sm text-coal/50 hover:underline" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              {t("Remove", "Quitar", lang)}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-berry hover:underline"
          onClick={() => setItems([...items, { qEn: "", qEs: "", aEn: "", aEs: "" }])}
        >
          {t("Add FAQ", "Agregar pregunta", lang)}
        </button>
      </div>
    );
  }

  if (slug === "stores") {
    type StoreItem = Record<string, string>;
    const items = (body.items as StoreItem[]) ?? [];
    const setItems = (next: StoreItem[]) => set({ items: next });
    const patch = (i: number, next: StoreItem) => setItems(items.map((x, j) => (j === i ? next : x)));
    return (
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <textarea
          value={str("intro_en")}
          onChange={(e) => set({ intro_en: e.target.value, intro_es: e.target.value })}
          placeholder={t("Intro", "Intro", lang)}
          className={inputClass}
          rows={2}
        />
        {items.map((item, i) => (
          <div key={i} className="space-y-2 border-t border-blush/40 pt-3">
            <input
              value={item.nameEn ?? item.nameEs ?? ""}
              onChange={(e) => patch(i, { ...item, nameEn: e.target.value, nameEs: e.target.value })}
              placeholder={t("Store name", "Nombre de la tienda", lang)}
              className={inputClass}
            />
            <input
              value={item.addrEn ?? item.addrEs ?? ""}
              onChange={(e) => patch(i, { ...item, addrEn: e.target.value, addrEs: e.target.value })}
              placeholder={t("Address", "Dirección", lang)}
              className={inputClass}
            />
            <input
              value={item.noteEn ?? item.noteEs ?? ""}
              onChange={(e) => patch(i, { ...item, noteEn: e.target.value, noteEs: e.target.value })}
              placeholder={t("Note", "Nota", lang)}
              className={inputClass}
            />
            <button type="button" className="text-sm text-coal/50 hover:underline" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              {t("Remove", "Quitar", lang)}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-berry hover:underline"
          onClick={() =>
            setItems([...items, { nameEn: "", nameEs: "", addrEn: "", addrEs: "", noteEn: "", noteEs: "" }])
          }
        >
          {t("Add store", "Agregar tienda", lang)}
        </button>
      </div>
    );
  }

  if (slug === "events") {
    type Item = Record<string, string>;
    const items = (body.items as Item[]) ?? [];
    const setItems = (next: Item[]) => set({ items: next });
    const patch = (i: number, next: Item) => setItems(items.map((x, j) => (j === i ? next : x)));
    return (
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <textarea
          value={str("intro_en")}
          onChange={(e) => set({ intro_en: e.target.value, intro_es: e.target.value })}
          placeholder="Intro"
          className={inputClass}
          rows={2}
        />
        {items.map((item, i) => (
          <div key={i} className="space-y-2 border-t border-blush/40 pt-3">
            <input
              value={item.nameEn ?? ""}
              onChange={(e) => patch(i, { ...item, nameEn: e.target.value, nameEs: e.target.value })}
              placeholder="Name"
              className={inputClass}
            />
            <input
              value={item.dateEn ?? ""}
              onChange={(e) => patch(i, { ...item, dateEn: e.target.value, dateEs: e.target.value })}
              placeholder="Date"
              className={inputClass}
            />
            <input
              value={item.locEn ?? ""}
              onChange={(e) => patch(i, { ...item, locEn: e.target.value, locEs: e.target.value })}
              placeholder="Location"
              className={inputClass}
            />
            <button type="button" className="text-sm text-coal/50 hover:underline" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              {t("Remove", "Quitar", lang)}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-berry hover:underline"
          onClick={() =>
            setItems([...items, { nameEn: "", nameEs: "", dateEn: "", dateEs: "", locEn: "", locEs: "" }])
          }
        >
          {t("Add row", "Agregar fila", lang)}
        </button>
      </div>
    );
  }

  if (slug === "wholesale" || slug === "contact") {
    return (
      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <textarea
          value={str("intro_en")}
          onChange={(e) => set({ intro_en: e.target.value, intro_es: e.target.value })}
          placeholder="Intro"
          className={inputClass}
          rows={3}
        />
        <p className="text-xs text-coal/50">
          {t("The inquiry form on this page stays as-is.", "El formulario de contacto en esta página no cambia.", lang)}
        </p>
      </div>
    );
  }

  const hoursEn = (body.hours_en as string[]) ?? [];
  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <input value={str("street")} onChange={(e) => set({ street: e.target.value })} placeholder="Street" className={inputClass} />
      <input value={str("cityLine")} onChange={(e) => set({ cityLine: e.target.value })} placeholder="City line" className={inputClass} />
      <input value={str("country")} onChange={(e) => set({ country: e.target.value })} placeholder="Country" className={inputClass} />
      <textarea
        value={hoursEn.join("\n")}
        onChange={(e) => {
          const lines = e.target.value.split("\n");
          set({ hours_en: lines, hours_es: lines });
        }}
        placeholder="Hours (one line each)"
        className={inputClass}
        rows={3}
      />
      <textarea
        value={str("placeholder_en")}
        onChange={(e) => set({ placeholder_en: e.target.value, placeholder_es: e.target.value })}
        placeholder="Footer note"
        className={inputClass}
        rows={2}
      />
    </div>
  );
}

function ReviewForm({
  review,
  onChange,
  onSave,
  onDelete,
}: {
  review: ReviewItem;
  onChange: (row: ReviewItem) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const set = (patch: Partial<ReviewItem>) => onChange({ ...review, ...patch });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadMsg("");
    setUploading(true);
    try {
      set({ image_url: await uploadAdminImage(file) });
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <textarea
        value={review.quote_en}
        onChange={(e) => set({ quote_en: e.target.value })}
        placeholder="Quote"
        rows={2}
        className={inputClass}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={review.reviewer_name}
          onChange={(e) => set({ reviewer_name: e.target.value })}
          placeholder="Name"
          className={inputClass}
        />
        <input
          value={review.city_en}
          onChange={(e) => set({ city_en: e.target.value })}
          placeholder="City"
          className={inputClass}
        />
      </div>
      <div>
        <input
          value={review.image_url}
          onChange={(e) => set({ image_url: e.target.value })}
          placeholder="Image URL"
          className={inputClass}
        />
        <label className="mt-2 block text-sm text-coal/70">
          {uploading ? "Uploading…" : "Or upload from this computer"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void pickFile(file);
            }}
          />
        </label>
        {uploadMsg ? <p className="text-sm text-berry">{uploadMsg}</p> : null}
        {review.image_url ? (
          <img src={review.image_url} alt="" className="mt-2 h-20 rounded-lg object-cover" />
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={review.active} onChange={(e) => set({ active: e.target.checked })} />
        Show on homepage
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onSave} className="rounded-xl bg-berry px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-xl px-4 py-2 text-sm text-coal/60 hover:text-berry">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function OfferForm({
  offer,
  categories,
  lang,
  onChange,
  onSave,
  onDelete,
}: {
  offer: OfferRow;
  categories: CategoryRow[];
  lang: "en" | "es";
  onChange: (row: OfferRow) => void;
  onSave: (row: OfferRow) => void;
  onDelete?: () => void;
}) {
  const set = (patch: Partial<OfferRow>) => onChange({ ...offer, ...patch });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadMsg("");
    setUploading(true);
    try {
      set({ image_url: await uploadAdminImage(file) });
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : t("Upload failed", "No se pudo subir", lang));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={offer.title_en} onChange={(e) => set({ title_en: e.target.value })} placeholder="Title (EN)" className={inputClass} />
        <input value={offer.title_es} onChange={(e) => set({ title_es: e.target.value })} placeholder="Título (ES)" className={inputClass} />
        <input value={offer.offer_en} onChange={(e) => set({ offer_en: e.target.value })} placeholder="Offer (EN)" className={inputClass} />
        <input value={offer.offer_es} onChange={(e) => set({ offer_es: e.target.value })} placeholder="Oferta (ES)" className={inputClass} />
        <div className="space-y-2 sm:col-span-2">
          <input
            value={offer.image_url}
            onChange={(e) => set({ image_url: e.target.value })}
            placeholder="Image URL or /test-images/…"
            className={inputClass}
          />
          <label className="flex flex-wrap items-center gap-3 text-sm text-coal/70">
            <span className="shrink-0 font-medium text-berry">
              {uploading ? t("Uploading…", "Subiendo…", lang) : t("Or upload from this computer", "O sube desde esta computadora", lang)}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              className="max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blush/50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-coal"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void pickFile(file);
              }}
            />
          </label>
          {uploadMsg && <p className="text-sm text-berry">{uploadMsg}</p>}
          {offer.image_url ? (
            <img src={offer.image_url} alt="" className="h-20 rounded-lg object-cover" />
          ) : null}
        </div>
        <input value={offer.tag_en ?? ""} onChange={(e) => set({ tag_en: e.target.value })} placeholder="Tag EN" className={inputClass} />
        <input value={offer.tag_es ?? ""} onChange={(e) => set({ tag_es: e.target.value })} placeholder="Tag ES" className={inputClass} />
        <input
          inputMode="decimal"
          value={offer.priceDraft ?? ""}
          onChange={(e) => set({ priceDraft: e.target.value })}
          placeholder={t("Price $ (menu item)", "Precio $ (en el menú)", lang)}
          className={inputClass}
        />
        <select
          value={offer.category_id || categories[0]?.id || "cat-cookies"}
          onChange={(e) => set({ category_id: e.target.value })}
          className={inputClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {lang === "es" ? c.name_es : c.name_en}
            </option>
          ))}
        </select>
        <label className="text-sm text-coal/70">
          {t("Slide order (1 first)", "Orden del slide (1 primero)", lang)}
          <input
            type="number"
            value={offer.sort}
            onChange={(e) => set({ sort: Number(e.target.value) || 0 })}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={offer.active} onChange={(e) => set({ active: e.target.checked })} />
          {t("Active on home", "Activa en inicio", lang)}
        </label>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => onSave(offer)} className="text-sm font-medium text-berry hover:underline">
          {t("Save", "Guardar", lang)}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="text-sm text-coal/50 hover:underline">
            {t("Delete", "Borrar", lang)}
          </button>
        )}
      </div>
    </div>
  );
}
