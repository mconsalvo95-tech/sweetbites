"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { formatCad, t } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PromoKind } from "@/lib/promos";

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
  order_items: OrderItemRow[] | null;
};

const ADMIN_TABS = [
  { id: "orders", labelEn: "Orders", labelEs: "Pedidos" },
  { id: "menu", labelEn: "Menu prices", labelEs: "Precios del menú" },
  { id: "offers", labelEn: "Weekly offers", labelEs: "Ofertas de la semana" },
  { id: "promos", labelEn: "Promo codes", labelEs: "Códigos de promo" },
  { id: "access", labelEn: "Owner access", labelEs: "Acceso de dueña" },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]["id"];

const ORDER_STATUSES = ["pending", "ready", "completed", "sent", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function orderStatusLabel(status: string, lang: "en" | "es") {
  switch (status) {
    case "pending":
      return t("Pending", "Pendiente", lang);
    case "ready":
      return t("Ready", "Listo", lang);
    case "completed":
      return t("Completed", "Completado", lang);
    case "sent":
      return t("Sent", "Enviado", lang);
    case "cancelled":
      return t("Cancelled", "Cancelado", lang);
    default:
      return status;
  }
}

function isOrderDone(status: string) {
  return status === "completed" || status === "sent";
}

function doneStatusFor(fulfillment: OrderRow["fulfillment"]): OrderStatus {
  return fulfillment === "ship" ? "sent" : "completed";
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

type CategoryRow = { id: string; name_en: string; name_es: string };

export function AdminClient() {
  const { lang } = useLang();
  const { user, profile, loading, configured } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: AdminTab = ADMIN_TABS.some((item) => item.id === tabParam)
    ? (tabParam as AdminTab)
    : "orders";
  const [orderFilter, setOrderFilter] = useState<OrderStatus>("pending");
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
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [status, setStatus] = useState("");
  const [grantEmail, setGrantEmail] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newKind, setNewKind] = useState<PromoKind>("percent");
  const [newValue, setNewValue] = useState("10");
  const [newMin, setNewMin] = useState("0");

  const [draftOffer, setDraftOffer] = useState<OfferRow>(emptyOffer);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const [{ data: promoData }, { data: offerData }, { data: productData }, { data: orderData }, { data: catData }] =
      await Promise.all([
        supabase.from("promo_codes").select("*").order("code"),
        supabase.from("weekly_offers").select("*").order("sort"),
        supabase.from("products").select("id, name_en, name_es, slug, price_cents, active, category_id").order("name_en"),
        supabase
          .from("orders")
          .select(
            "id, created_at, status, fulfillment, customer_name, customer_email, phone, notes, food_cents, shipping_cents, discount_cents, total_cents, promo_code, ship_street, ship_city, ship_province, ship_postal, order_items ( qty, unit_price_cents, options_json, product_id, name_en, name_es, products ( name_en, name_es ) )",
          )
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("categories").select("id, name_en, name_es").order("sort"),
      ]);
    const productRows = (productData as ProductRow[]) ?? [];
    setPromos((promoData as PromoRow[]) ?? []);
    setProducts(productRows);
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
    setOrders((orderData as OrderRow[]) ?? []);
    setCategories((catData as CategoryRow[]) ?? []);
    if (catData?.[0]?.id) setNewCat((c) => c || catData[0].id);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") void load();
  }, [profile?.role, load]);

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

  const savePromo = async (row: PromoRow, isNew = false) => {
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
    const { error } = isNew
      ? await supabase.from("promo_codes").insert(payload)
      : await supabase.from("promo_codes").update(payload).eq("code", payload.code);
    if (error) {
      flash(error.message);
      return;
    }
    flash(t("Saved", "Guardado", lang));
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
    const { error } = await supabase
      .from("products")
      .update({ price_cents, active: row.active })
      .eq("id", row.id);
    if (error) {
      flash(error.message);
      return;
    }
    setProducts((rows) =>
      rows.map((r) => (r.id === row.id ? { ...r, price_cents, priceDraft: undefined } : r)),
    );
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

  const visibleOrders = orders.filter((row) => row.status === orderFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-berry">{t("Shop admin", "Admin de la tienda", lang)}</h1>
        <p className="mt-1 text-sm text-coal/70">
          {t("Orders, menu prices, weekly banners, and promo codes.", "Pedidos, precios del menú, banners de la semana y códigos de promo.", lang)}
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
                onClick={() => setOrderFilter(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  orderFilter === s ? "bg-coal text-white" : "bg-white text-coal/70 shadow-sm hover:bg-blush/40"
                }`}
              >
                {orderStatusLabel(s, lang)}
                {count ? ` ${count}` : ""}
              </button>
            );
          })}
        </div>
        {visibleOrders.length === 0 ? (
          <p className="text-sm text-coal/60">
            {orders.length === 0
              ? t("No orders yet.", "Aún no hay pedidos.", lang)
              : t("No orders in this list.", "No hay pedidos en esta lista.", lang)}
          </p>
        ) : (
          <div className="space-y-2">
            {visibleOrders.map((row) => {
              const open = openOrderId === row.id;
              return (
                <div key={row.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setOpenOrderId(open ? null : row.id)}
                      className="min-w-0 flex-1 text-left font-medium text-coal"
                    >
                      #{row.id.slice(0, 8)} · {row.customer_name} · {formatCad(row.total_cents)}
                      <span className="ml-2 font-normal text-coal/50">
                        {" · "}
                        {new Date(row.created_at).toLocaleString()}
                      </span>
                    </button>
                    {row.status !== "cancelled" && (
                      <label className="flex shrink-0 items-center gap-1.5 text-sm text-coal/80">
                        <input
                          type="checkbox"
                          checked={isOrderDone(row.status)}
                          onChange={(e) =>
                            void saveOrderStatus(
                              row.id,
                              e.target.checked ? doneStatusFor(row.fulfillment) : "pending",
                            )
                          }
                        />
                        {t("Done", "Hecho", lang)}
                      </label>
                    )}
                    <select
                      value={row.status}
                      onChange={(e) => void saveOrderStatus(row.id, e.target.value)}
                      className="w-auto rounded-xl border border-blush/60 bg-white px-3 py-2 text-sm text-coal outline-none focus:border-berry"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {orderStatusLabel(s, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {open && (
                    <div className="mt-3 space-y-2 border-t border-blush/40 pt-3 text-sm">
                      <p>
                        {row.fulfillment} · {row.customer_email || "—"} · {row.phone}
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
                      <p className="font-semibold text-berry">
                        {t("Total", "Total", lang)} {formatCad(row.total_cents)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
                <th className="pb-2">{t("Product", "Producto", lang)}</th>
                <th className="pb-2">{t("Price $", "Precio $", lang)}</th>
                <th className="pb-2">{t("On menu", "En menú", lang)}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {products.map((row) => (
                <tr key={row.id} className="border-t border-blush/40">
                  <td className="py-2">
                    <p className="font-medium">{lang === "es" ? row.name_es : row.name_en}</p>
                    {lang === "es" ? <p className="text-xs text-coal/50">{row.name_en}</p> : null}
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
            <input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="Image URL or /test-images/…"
              className={`${inputClass} sm:col-span-2`}
            />
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
              {promos.map((row) => (
                <tr key={row.code} className="border-t border-blush/40">
                  <td className="py-2 font-medium">{row.code}</td>
                  <td className="py-2">
                    <select
                      value={row.kind}
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r) => (r.code === row.code ? { ...r, kind: e.target.value as PromoKind } : r)),
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
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r) =>
                            r.code === row.code
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
                      onChange={(e) =>
                        setPromos((rows) =>
                          rows.map((r) => (r.code === row.code ? { ...r, min_food_cents: toCents(e.target.value) } : r)),
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
                        setPromos((rows) =>
                          rows.map((r) => (r.code === row.code ? { ...r, active: e.target.checked } : r)),
                        )
                      }
                    />
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <button type="button" onClick={() => savePromo(row)} className="text-berry hover:underline">
                      {t("Save", "Guardar", lang)}
                    </button>
                    {" · "}
                    <button type="button" onClick={() => deletePromo(row.code)} className="text-coal/50 hover:underline">
                      {t("Delete", "Borrar", lang)}
                    </button>
                  </td>
                </tr>
              ))}
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
  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={offer.title_en} onChange={(e) => set({ title_en: e.target.value })} placeholder="Title (EN)" className={inputClass} />
        <input value={offer.title_es} onChange={(e) => set({ title_es: e.target.value })} placeholder="Título (ES)" className={inputClass} />
        <input value={offer.offer_en} onChange={(e) => set({ offer_en: e.target.value })} placeholder="Offer (EN)" className={inputClass} />
        <input value={offer.offer_es} onChange={(e) => set({ offer_es: e.target.value })} placeholder="Oferta (ES)" className={inputClass} />
        <input value={offer.image_url} onChange={(e) => set({ image_url: e.target.value })} placeholder="Image URL or /test-images/…" className={`${inputClass} sm:col-span-2`} />
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
