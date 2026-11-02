"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import {
  EMAIL_RE,
  formatCad,
  isValidCanadianPostal,
  normalizePostal,
  pickName,
  t,
} from "@/lib/format";
import { CompactOrderDateField } from "@/components/CompactOrderDateField";
import { fetchOrderCalendarBrowser, isBlockedOrderDate } from "@/lib/order-calendar";
import { isAllowedWantedOn, minWantedOnIso, nextAllowedWantedOn, WANTED_ON_RE } from "@/lib/shop";
import { searchCanadianAddresses, type AddressHit } from "@/lib/address-search";
import { primaryProductImage } from "@/lib/product-images";
import { PickupHint } from "@/components/FulfillmentPicker";
import type { Fulfillment, ShippingService } from "@/lib/types";

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

const FULFILLMENT_OPTIONS: Fulfillment[] = ["pickup", "ship"];

export default function CartPage() {
  const { lang } = useLang();
  const { user, profile } = useAuth();
  const router = useRouter();
  const {
    lines,
    fulfillment,
    setFulfillment,
    updateQty,
    removeLine,
    clearCart,
    foodTotalCents,
  } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("AB");
  const [postal, setPostal] = useState("");
  const [notes, setNotes] = useState("");
  const [wantedOn, setWantedOn] = useState(minWantedOnIso);
  const shipAddressTouched = useRef({
    street: false,
    city: false,
    province: false,
    postal: false,
  });
  const pickedStreet = useRef("");
  const [serviceCode, setServiceCode] = useState("");
  const [rates, setRates] = useState<ShippingService[]>([]);
  const [ratesSource, setRatesSource] = useState<"cpc" | "mock" | "">("");
  const [ratesError, setRatesError] = useState("");
  const [postalError, setPostalError] = useState("");
  const [addressHits, setAddressHits] = useState<AddressHit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discountCents: number } | null>(null);
  const [canceled, setCanceled] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const shippingCents = useMemo(() => {
    if (fulfillment === "pickup") return 0;
    return rates.find((r) => r.code === serviceCode)?.rateCents ?? 0;
  }, [fulfillment, rates, serviceCode]);

  const discountCents = applied?.discountCents ?? 0;
  const totalCents = foodTotalCents - discountCents + shippingCents;
  useEffect(() => {
    setCanceled(new URLSearchParams(window.location.search).get("canceled") === "1");
  }, []);

  useEffect(() => {
    void fetchOrderCalendarBrowser().then((body) => setBlockedDates(body.blocked_dates));
  }, []);

  useEffect(() => {
    if (blockedDates.length === 0) return;
    setWantedOn((current) => {
      if (isAllowedWantedOn(current, new Date(), blockedDates)) return current;
      return nextAllowedWantedOn(current, blockedDates);
    });
  }, [blockedDates]);

  useEffect(() => {
    if (!user) return;
    setEmail((value) => value || user.email || "");
    setName((value) => value || profile?.display_name || "");
    setPhone((value) => value || profile?.phone || "");
  }, [user, profile]);

  useEffect(() => {
    if (fulfillment !== "ship" || !profile) return;
    if (!shipAddressTouched.current.street && profile.address_street) {
      setStreet((v) => v || profile.address_street || "");
    }
    if (!shipAddressTouched.current.city && profile.address_city) {
      setCity((v) => v || profile.address_city || "");
    }
    if (!shipAddressTouched.current.province && profile.address_province) {
      setProvince(profile.address_province);
    }
    if (!shipAddressTouched.current.postal && profile.address_postal) {
      setPostal((v) => v || profile.address_postal || "");
    }
  }, [fulfillment, profile]);

  useEffect(() => {
    if (fulfillment !== "ship" || street.trim().length < 3 || street === pickedStreet.current) {
      setAddressHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchCanadianAddresses(street)
        .then((hits) => {
          if (!cancelled) setAddressHits(hits);
        })
        .catch(() => {
          if (!cancelled) setAddressHits([]);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [street, fulfillment]);

  const applyAddress = (hit: AddressHit) => {
    pickedStreet.current = hit.street;
    shipAddressTouched.current.street = true;
    shipAddressTouched.current.city = true;
    shipAddressTouched.current.province = true;
    shipAddressTouched.current.postal = true;
    setStreet(hit.street);
    setCity(hit.city);
    if (hit.province) setProvince(hit.province);
    setPostal(hit.postal);
    setPostalError("");
    setAddressHits([]);
  };

  useEffect(() => {
    if (fulfillment !== "ship") {
      setRates([]);
      setRatesSource("");
      setRatesError("");
      return;
    }
    if (!isValidCanadianPostal(postal) || lines.length === 0) {
      setRates([]);
      setRatesSource("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postal,
          items: lines.map((line) => ({ productId: line.productId, qty: line.qty })),
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (cancelled) return;
          if (!res.ok || !data.rates?.length) {
            setRates([]);
            setRatesSource("");
            setRatesError(t("No shipping options for that postal code", "No hay envío para ese código postal", lang));
            return;
          }
          setRatesError("");
          setRates(data.rates);
          setRatesSource(data.source === "cpc" ? "cpc" : "mock");
          setServiceCode((code) =>
            data.rates.some((r: ShippingService) => r.code === code) ? code : data.rates[0].code,
          );
        })
        .catch(() => {
          if (!cancelled) {
            setRates([]);
            setRatesError(t("Could not load shipping rates", "No se pudieron cargar las tarifas", lang));
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fulfillment, postal, lines, lang]);

  useEffect(() => {
    if (!applied) return;
    const code = applied.code;
    let cancelled = false;
    fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, foodCents: foodTotalCents }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setApplied(null);
          return;
        }
        setApplied({ code: data.code, discountCents: data.discountCents });
      })
      .catch(() => {
        if (!cancelled) setApplied(null);
      });
    return () => {
      cancelled = true;
    };
  }, [foodTotalCents, applied?.code]);

  const selectedService = rates.find((r) => r.code === serviceCode);

  const promoMessage = (err: string, minFoodCents?: number) => {
    if (err === "min_order") {
      return t(
        `Minimum food total is ${formatCad(minFoodCents ?? 0)}`,
        `El mínimo de comida es ${formatCad(minFoodCents ?? 0)}`,
        lang,
      );
    }
    return t("That code isn’t valid", "Ese código no es válido", lang);
  };

  const handleApplyPromo = async () => {
    setPromoError("");
    if (!promoInput.trim()) {
      setApplied(null);
      return;
    }
    setPromoBusy(true);
    try {
      const res = await fetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, foodCents: foodTotalCents }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setApplied(null);
        setPromoError(promoMessage(data.error, data.minFoodCents));
        return;
      }
      setPromoInput(data.code);
      setApplied({ code: data.code, discountCents: data.discountCents });
    } catch {
      setApplied(null);
      setPromoError(t("Couldn’t check that code", "No se pudo verificar el código", lang));
    } finally {
      setPromoBusy(false);
    }
  };

  const fulfillmentLabel = (f: Fulfillment) => {
    if (f === "pickup") return t("Pickup", "Recoger", lang);
    return t("Ship", "Enviar", lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPostalError("");

    if (!name.trim() || !phone.trim() || !email.trim() || !EMAIL_RE.test(email.trim())) {
      setError(t("Name, email, and phone are required", "Nombre, correo y teléfono son obligatorios", lang));
      return;
    }

    if (!WANTED_ON_RE.test(wantedOn)) {
      setError(t("Pick a pickup or ship date", "Elige una fecha de recogida o envío", lang));
      return;
    }
    if (!isAllowedWantedOn(wantedOn, new Date(), blockedDates)) {
      setError(
        isBlockedOrderDate(wantedOn, blockedDates)
          ? t(
              "That date is not available. Please pick another day.",
              "Esa fecha no está disponible. Elige otro día.",
              lang,
            )
          : t(
              "Orders require a minimum of 2 days’ notice. Same-day and next-day orders are not available.",
              "Los pedidos requieren un mínimo de 2 días de anticipación. No hay pedidos para hoy ni para mañana.",
              lang,
            ),
      );
      return;
    }

    if (fulfillment === "ship") {
      if (!street.trim() || !city.trim() || !province) {
        setError(t("Complete the shipping address", "Completa la dirección de envío", lang));
        return;
      }
      if (!isValidCanadianPostal(postal)) {
        setPostalError(t("Use format A1A 1A1", "Usa el formato A1A 1A1", lang));
        return;
      }
      if (!selectedService) {
        setError(t("Select a shipping option", "Selecciona una opción de envío", lang));
        return;
      }
    }

    setSubmitting(true);
    try {
      const needsAddress = fulfillment === "ship";
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillment,
          lang,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          phone: phone.trim(),
          shipStreet: needsAddress ? street.trim() : undefined,
          shipCity: needsAddress ? city.trim() : undefined,
          shipProvince: fulfillment === "ship" ? province : undefined,
          shipPostal: fulfillment === "ship" ? normalizePostal(postal) : undefined,
          notes: notes.trim() || undefined,
          wantedOn,
          foodCents: foodTotalCents,
          shippingCents,
          totalCents,
          items: lines,
          serviceCode: fulfillment === "ship" ? serviceCode : undefined,
          serviceNameEn: selectedService?.nameEn,
          serviceNameEs: selectedService?.nameEs,
          promoCode: (applied?.code || promoInput).trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      if (
        process.env.NEXT_PUBLIC_SQUARE_PAY &&
        totalCents > 0 &&
        !data.checkoutUrl
      ) {
        throw new Error(
          t(
            "Card checkout is unavailable. Try again or contact the shop.",
            "El pago con tarjeta no está disponible. Intenta de nuevo o contacta la tienda.",
            lang,
          ),
        );
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`sweetbites-order-${data.id}`, JSON.stringify({
          fulfillment,
          lang,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          phone: phone.trim(),
          foodCents: foodTotalCents,
          shippingCents,
          totalCents,
          discountCents,
          promoCode: applied?.code,
          items: lines,
          notes: notes.trim() || undefined,
          wantedOn,
          serviceCode: fulfillment === "ship" ? serviceCode : undefined,
          serviceNameEn: selectedService?.nameEn,
          serviceNameEs: selectedService?.nameEs,
          paymentStatus: data.checkoutUrl ? "unpaid" : "paid",
        }));
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
        return;
      }

      clearCart();
      router.push(`/order-status/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="relative z-10 py-12 text-center">
        <p className="text-coal/70">{t("Your cart is empty", "Tu carrito está vacío", lang)}</p>
        <button
          type="button"
          onClick={() => router.push("/order")}
          className="mt-4 text-berry underline"
        >
          {t("Browse menu", "Ver menú", lang)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("Cart", "Carrito", lang)}</h1>

      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.lineId} className="flex gap-3 rounded-[18px] bg-white p-3 shadow-sm">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-blush/30">
              {line.imageUrl ? (
                <Image
                  src={primaryProductImage(line.imageUrl)}
                  alt=""
                  fill
                  unoptimized={primaryProductImage(line.imageUrl).startsWith("http")}
                  className="object-cover"
                  sizes="64px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">{pickName(line, lang)}</p>
              {Object.entries(line.optionsJson).map(([key, vals]) => (
                <p key={key} className="text-xs text-coal/60">
                  {key}: {vals.join(", ")}
                </p>
              ))}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(line.lineId, line.qty - 1)}
                    className="h-7 w-7 rounded-full bg-blush/35"
                  >
                    −
                  </button>
                  <span className="text-sm">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(line.lineId, line.qty + 1)}
                    className="h-7 w-7 rounded-full bg-blush/35"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-berry">
                    {formatCad(line.unitPriceCents * line.qty)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeLine(line.lineId)}
                    className="text-xs text-coal/50 underline"
                  >
                    {t("Remove", "Quitar", lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] bg-white p-4 shadow-sm">
        <h2 className="font-medium">{t("Fulfillment", "Entrega", lang)}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {FULFILLMENT_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFulfillment(f)}
              className={`rounded-xl py-2.5 text-xs font-medium sm:text-sm ${
                fulfillment === f
                  ? "bg-berry text-white"
                  : "bg-blush/30 text-coal"
              }`}
            >
              {fulfillmentLabel(f)}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label htmlFor="wanted-on" className="text-sm font-medium text-coal/80">
            {fulfillment === "ship"
              ? t("Ship date", "Fecha de envío", lang)
              : t("Pickup date", "Fecha de recogida", lang)}
          </label>
          <CompactOrderDateField
            id="wanted-on"
            lang={lang}
            value={wantedOn}
            blockedDates={blockedDates}
            onChange={(iso) => {
              setError("");
              setWantedOn(iso);
            }}
            onBlockedPick={() =>
              setError(
                t(
                  "That date is not available. Please pick another day.",
                  "Esa fecha no está disponible. Elige otro día.",
                  lang,
                ),
              )
            }
          />
        </div>
        <p className="mt-2 text-xs text-coal/65">
          {t(
            "Orders require a minimum of 2 days’ notice. Same-day and next-day orders are not available.",
            "Los pedidos requieren un mínimo de 2 días de anticipación. No hay pedidos para hoy ni para mañana.",
            lang,
          )}
        </p>
      </div>

      <div className="space-y-3 rounded-[18px] bg-white p-4 shadow-sm">
        <h2 className="font-medium">{t("Your details", "Tus datos", lang)}</h2>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("Full name", "Nombre completo", lang)}
          className="input-field"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("Email", "Correo", lang)}
          autoComplete="email"
          className="input-field"
        />
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("Phone", "Teléfono", lang)}
          className="input-field"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("Order notes (optional)", "Notas del pedido (opcional)", lang)}
          rows={2}
          className="input-field"
        />
      </div>

      {fulfillment === "pickup" ? (
        <div className="rounded-[18px] bg-white p-4 shadow-sm">
          <PickupHint />
        </div>
      ) : (
        <div className="space-y-3 rounded-[18px] bg-white p-4 shadow-sm">
          <h2 className="font-medium">{t("Ship in Canada", "Enviar en Canadá", lang)}</h2>
          <p className="text-sm text-coal/70">
            {t(
              "Start typing a Canadian address and pick a match, or type it yourself.",
              "Empieza a escribir una dirección de Canadá y elige una opción, o escríbela tú.",
              lang,
            )}
          </p>
          <div className="relative">
            <input
              value={street}
              onChange={(e) => {
                shipAddressTouched.current.street = true;
                setStreet(e.target.value);
              }}
              placeholder={t("Street address", "Dirección", lang)}
              className="input-field"
              autoComplete="off"
            />
            {addressHits.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-blush/50 bg-white shadow-md">
                {addressHits.map((hit) => (
                  <li key={hit.label}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyAddress(hit)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blush/30"
                    >
                      {hit.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            value={city}
            onChange={(e) => {
              shipAddressTouched.current.city = true;
              setCity(e.target.value);
            }}
            placeholder={t("City", "Ciudad", lang)}
            className="input-field"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={province}
              onChange={(e) => {
                shipAddressTouched.current.province = true;
                setProvince(e.target.value);
              }}
              className="input-field"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              value={postal}
              onChange={(e) => {
                shipAddressTouched.current.postal = true;
                setPostal(e.target.value.toUpperCase());
                setPostalError("");
              }}
              placeholder="A1A 1A1"
              className="input-field uppercase"
            />
          </div>
          {postalError && <p className="text-sm text-red-600">{postalError}</p>}
        </div>
      )}

      {fulfillment === "ship" && ratesError && (
        <p className="text-sm text-red-600">{ratesError}</p>
      )}

      {fulfillment === "ship" && rates.length > 0 && (
            <div className="space-y-2 rounded-[18px] bg-white p-4 shadow-sm">
              <h2 className="font-medium">
                {ratesSource === "cpc"
                  ? t("Canada Post", "Canada Post", lang)
                  : t("Canada Post (estimated)", "Canada Post (estimado)", lang)}
              </h2>
              {rates.map((rate) => (
                <label
                  key={rate.code}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                    serviceCode === rate.code
                      ? "border-berry bg-berry/5"
                      : "border-blush/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={serviceCode === rate.code}
                    onChange={() => setServiceCode(rate.code)}
                    className="mt-1 accent-berry"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {lang === "es" ? rate.nameEs : rate.nameEn}
                    </p>
                    <p className="text-xs text-coal/60">
                      {lang === "es" ? rate.etaEs : rate.etaEn}
                    </p>
                  </div>
                  <span className="font-semibold text-berry">
                    {formatCad(rate.rateCents)}
                  </span>
                </label>
              ))}
            </div>
      )}

      <div className="space-y-2 rounded-[18px] bg-white p-4 shadow-sm text-sm">
        <div className="flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => {
              setPromoInput(e.target.value.toUpperCase());
              setPromoError("");
            }}
            placeholder={t("Promo code", "Código de promo", lang)}
            className="input-field flex-1 uppercase"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleApplyPromo();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={promoBusy}
            className="shrink-0 rounded-xl bg-blush/40 px-4 text-sm font-medium text-coal disabled:opacity-60 hover:bg-blush/60"
          >
            {promoBusy ? t("Checking…", "Revisando…", lang) : t("Apply", "Aplicar", lang)}
          </button>
        </div>
        {promoError && <p className="text-sm text-red-600">{promoError}</p>}
        {applied && !promoError && (
          <p className="text-sm text-berry">
            {t(`Code ${applied.code} applied`, `Código ${applied.code} aplicado`, lang)}
          </p>
        )}
        <div className="flex justify-between pt-2">
          <span>{t("Food", "Comida", lang)}</span>
          <span>{formatCad(foodTotalCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-berry">
            <span>{t("Promo", "Promo", lang)}</span>
            <span>−{formatCad(discountCents)}</span>
          </div>
        )}
        {fulfillment === "ship" && (
          <div className="flex justify-between">
            <span>
              {t("Shipping", "Envío", lang)}
            </span>
            <span>{formatCad(shippingCents)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-blush/40 pt-2 text-base font-semibold">
          <span>{t("Total", "Total", lang)}</span>
          <span className="text-berry">{formatCad(totalCents)}</span>
        </div>
      </div>

      <div className="rounded-[18px] bg-blush/25 p-4 text-sm text-coal/80">
        <p className="font-semibold text-coal">{t("Please note", "Ten en cuenta", lang)}</p>
        <p className="mt-2">
          {t(
            "Once an order has been placed, cancellations are not available. However, if you need to change your order date, we’re happy to help you reschedule your pickup or delivery (subject to availability).",
            "Una vez realizado el pedido, no se puede cancelar. Si necesitas cambiar la fecha, con gusto te ayudamos a reprogramar la recogida o la entrega (según disponibilidad).",
            lang,
          )}
        </p>
        <p className="mt-2">
          {t(
            "Please contact us directly as soon as possible to make any changes.",
            "Contáctanos directamente lo antes posible para hacer cualquier cambio.",
            lang,
          )}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {canceled && (
        <p className="text-sm text-coal/70">
          {t("Payment was not completed. Your cart is still here.", "El pago no se completó. Tu carrito sigue aquí.", lang)}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full rounded-full bg-berry py-3.5 font-semibold text-white shadow-md disabled:opacity-60 hover:bg-berry-hover"
      >
        {submitting
          ? t("Placing order…", "Enviando pedido…", lang)
          : process.env.NEXT_PUBLIC_SQUARE_PAY
            ? t("Pay with Square", "Pagar con Square", lang)
            : t("Place order", "Confirmar pedido", lang)}
      </button>
    </form>
  );
}
