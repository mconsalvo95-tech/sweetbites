"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import type { InquiryType } from "@/lib/inquiries";

type Props = {
  type: InquiryType;
  compact?: boolean;
};

export function InquiryForm({ type, compact }: Props) {
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          lang,
          email,
          name: type === "contact" ? name : undefined,
          phone: type === "wholesale" ? phone : undefined,
          business: type === "wholesale" ? business : undefined,
          city: type === "wholesale" ? city : undefined,
          message: type !== "newsletter" ? message : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
      setBusiness("");
      setCity("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="rounded-[18px] bg-mint/20 px-4 py-3 text-sm text-coal">
        {t("Thanks! We'll be in touch.", "¡Gracias! Te contactaremos pronto.", lang)}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "flex gap-2" : "space-y-3"}>
      {type === "contact" && (
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("Your name", "Tu nombre", lang)}
          className="input-field"
        />
      )}
      {type === "wholesale" && (
        <>
          <input
            required
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder={t("Business name", "Nombre del negocio", lang)}
            className="input-field"
          />
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("City", "Ciudad", lang)}
            className="input-field"
          />
        </>
      )}
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("Email", "Correo", lang)}
        className={compact ? "input-field min-w-0 flex-1" : "input-field"}
      />
      {type === "wholesale" && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("Phone (optional)", "Teléfono (opcional)", lang)}
          className="input-field"
        />
      )}
      {type !== "newsletter" && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            type === "wholesale"
              ? t("Tell us about your needs", "Cuéntanos qué necesitas", lang)
              : t("Your message", "Tu mensaje", lang)
          }
          rows={compact ? 1 : 4}
          className="input-field"
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className={`btn-primary shrink-0 rounded-full bg-berry font-semibold text-white shadow-md hover:bg-berry-hover disabled:opacity-60 ${
          compact ? "px-5 py-2.5 text-sm" : "w-full py-3"
        }`}
      >
        {submitting
          ? t("Sending…", "Enviando…", lang)
          : type === "newsletter"
            ? t("Subscribe", "Suscribirse", lang)
            : t("Send", "Enviar", lang)}
      </button>
    </form>
  );
}
