"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import {
  formatCad,
  isValidCanadianPostal,
  normalizePostal,
  pickName,
  t,
} from "@/lib/format";
import { getMockShippingRates } from "@/lib/shipping";
import type { ShippingService } from "@/lib/types";

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

export default function CartPage() {
  const { lang } = useLang();
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
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("ON");
  const [postal, setPostal] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceCode, setServiceCode] = useState("regular");
  const [rates, setRates] = useState<ShippingService[]>([]);
  const [postalError, setPostalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const shippingCents = useMemo(() => {
    if (fulfillment === "pickup") return 0;
    return rates.find((r) => r.code === serviceCode)?.rateCents ?? 0;
  }, [fulfillment, rates, serviceCode]);

  const totalCents = foodTotalCents + shippingCents;

  useEffect(() => {
    if (fulfillment !== "ship") return;
    if (!isValidCanadianPostal(postal)) {
      setRates([]);
      return;
    }
    setRates(getMockShippingRates(postal));
  }, [fulfillment, postal]);

  const selectedService = rates.find((r) => r.code === serviceCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPostalError("");

    if (!name.trim() || !phone.trim()) {
      setError(t("Name and phone are required", "Nombre y teléfono son obligatorios", lang));
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
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillment,
          lang,
          customerName: name.trim(),
          phone: phone.trim(),
          shipStreet: fulfillment === "ship" ? street.trim() : undefined,
          shipCity: fulfillment === "ship" ? city.trim() : undefined,
          shipProvince: fulfillment === "ship" ? province : undefined,
          shipPostal: fulfillment === "ship" ? normalizePostal(postal) : undefined,
          notes: notes.trim() || undefined,
          foodCents: foodTotalCents,
          shippingCents,
          totalCents,
          items: lines,
          serviceCode: fulfillment === "ship" ? serviceCode : undefined,
          serviceNameEn: selectedService?.nameEn,
          serviceNameEs: selectedService?.nameEs,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      if (typeof window !== "undefined") {
        localStorage.setItem(`sweetbites-order-${data.id}`, JSON.stringify({
          fulfillment,
          lang,
          customerName: name.trim(),
          phone: phone.trim(),
          foodCents: foodTotalCents,
          shippingCents,
          totalCents,
          items: lines,
          serviceCode: fulfillment === "ship" ? serviceCode : undefined,
          serviceNameEn: selectedService?.nameEn,
          serviceNameEs: selectedService?.nameEs,
        }));
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
      <div className="py-12 text-center">
        <p className="text-[#2B1E14]/70">{t("Your cart is empty", "Tu carrito está vacío", lang)}</p>
        <button
          type="button"
          onClick={() => router.push("/order")}
          className="mt-4 text-[#C45C26] underline"
        >
          {t("Browse menu", "Ver menú", lang)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("Cart", "Carrito", lang)}</h1>

      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.lineId} className="flex gap-3 rounded-[18px] bg-white p-3 shadow-sm">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">{pickName(line, lang)}</p>
              {Object.entries(line.optionsJson).map(([key, vals]) => (
                <p key={key} className="text-xs text-[#2B1E14]/60">
                  {key}: {vals.join(", ")}
                </p>
              ))}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(line.lineId, line.qty - 1)}
                    className="h-7 w-7 rounded-full bg-[#F6F0E6]"
                  >
                    −
                  </button>
                  <span className="text-sm">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(line.lineId, line.qty + 1)}
                    className="h-7 w-7 rounded-full bg-[#F6F0E6]"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#C45C26]">
                    {formatCad(line.unitPriceCents * line.qty)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeLine(line.lineId)}
                    className="text-xs text-[#2B1E14]/50 underline"
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
          {(["pickup", "ship"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFulfillment(f)}
              className={`rounded-xl py-2.5 text-sm font-medium ${
                fulfillment === f
                  ? "bg-[#C45C26] text-white"
                  : "bg-[#F6F0E6] text-[#2B1E14]"
              }`}
            >
              {f === "pickup"
                ? t("Pickup", "Recoger", lang)
                : t("Ship", "Enviar", lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-[18px] bg-white p-4 shadow-sm">
        <h2 className="font-medium">{t("Your details", "Tus datos", lang)}</h2>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("Full name", "Nombre completo", lang)}
          className="w-full rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm outline-none focus:border-[#C45C26]"
        />
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("Phone", "Teléfono", lang)}
          className="w-full rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm outline-none focus:border-[#C45C26]"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("Order notes (optional)", "Notas del pedido (opcional)", lang)}
          rows={2}
          className="w-full rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm outline-none focus:border-[#C45C26]"
        />
      </div>

      {fulfillment === "ship" && (
        <>
          <div className="space-y-3 rounded-[18px] bg-white p-4 shadow-sm">
            <h2 className="font-medium">{t("Ship to (Canada)", "Enviar a (Canadá)", lang)}</h2>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder={t("Street address", "Dirección", lang)}
              className="w-full rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm outline-none focus:border-[#C45C26]"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("City", "Ciudad", lang)}
              className="w-full rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm outline-none focus:border-[#C45C26]"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm outline-none focus:border-[#C45C26]"
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                value={postal}
                onChange={(e) => {
                  setPostal(e.target.value.toUpperCase());
                  setPostalError("");
                }}
                placeholder="A1A 1A1"
                className="rounded-xl border border-[#e8dfd3] bg-[#F6F0E6]/50 px-3 py-2.5 text-sm uppercase outline-none focus:border-[#C45C26]"
              />
            </div>
            {postalError && <p className="text-sm text-red-600">{postalError}</p>}
          </div>

          {rates.length > 0 && (
            <div className="space-y-2 rounded-[18px] bg-white p-4 shadow-sm">
              <h2 className="font-medium">
                {t("Canada Post (mock rates)", "Canada Post (tarifas simuladas)", lang)}
              </h2>
              {rates.map((rate) => (
                <label
                  key={rate.code}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                    serviceCode === rate.code
                      ? "border-[#C45C26] bg-[#C45C26]/5"
                      : "border-[#e8dfd3]"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={serviceCode === rate.code}
                    onChange={() => setServiceCode(rate.code)}
                    className="mt-1 accent-[#C45C26]"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {lang === "es" ? rate.nameEs : rate.nameEn}
                    </p>
                    <p className="text-xs text-[#2B1E14]/60">
                      {lang === "es" ? rate.etaEs : rate.etaEn}
                    </p>
                  </div>
                  <span className="font-semibold text-[#C45C26]">
                    {formatCad(rate.rateCents)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </>
      )}

      <div className="rounded-[18px] bg-white p-4 shadow-sm space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{t("Food", "Comida", lang)}</span>
          <span>{formatCad(foodTotalCents)}</span>
        </div>
        {fulfillment === "ship" && (
          <div className="flex justify-between">
            <span>{t("Shipping", "Envío", lang)}</span>
            <span>{formatCad(shippingCents)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#e8dfd3] pt-2 text-base font-semibold">
          <span>{t("Total", "Total", lang)}</span>
          <span className="text-[#C45C26]">{formatCad(totalCents)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#C45C26] py-3.5 font-semibold text-white shadow-md disabled:opacity-60"
      >
        {submitting
          ? t("Placing order…", "Enviando pedido…", lang)
          : t("Place order", "Confirmar pedido", lang)}
      </button>
    </form>
  );
}
