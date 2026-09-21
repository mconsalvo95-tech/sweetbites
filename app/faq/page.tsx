"use client";

import { useLang } from "@/lib/lang";

const FAQS = [
  {
    qEn: "How does pickup work?",
    qEs: "¿Cómo funciona la recogida?",
    aEn: "Order online, choose pickup, and we'll text when your box is ready at 124 King Street W.",
    aEs: "Pide en línea, elige recoger, y te avisaremos cuando tu caja esté lista en 124 King Street W.",
  },
  {
    qEn: "Do you deliver locally?",
    qEs: "¿Hacen entrega local?",
    aEn: "Yes — Toronto-area delivery is a flat $6. Enter your address at checkout.",
    aEs: "Sí — entrega en Toronto por $6 fijo. Ingresa tu dirección al pagar.",
  },
  {
    qEn: "Can you ship across Canada?",
    qEs: "¿Envían a todo Canadá?",
    aEn: "Yes, via Canada Post. Rates are estimated at checkout (mock for now).",
    aEs: "Sí, con Canada Post. Las tarifas se estiman al pagar (simuladas por ahora).",
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

export default function FaqPage() {
  const { lang } = useLang();

  return (
    <div className="relative z-10 space-y-6">
      <h1 className="font-display text-2xl uppercase text-coal">FAQ</h1>
      <div className="space-y-4">
        {FAQS.map((faq) => (
          <div key={faq.qEn} className="rounded-[18px] bg-white p-4 shadow-sm">
            <h2 className="font-medium text-coal">{lang === "es" ? faq.qEs : faq.qEn}</h2>
            <p className="mt-2 text-sm text-coal/75">{lang === "es" ? faq.aEs : faq.aEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
