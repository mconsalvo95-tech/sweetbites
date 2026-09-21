"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export default function AboutPage() {
  const { lang } = useLang();

  return (
    <div className="relative z-10 space-y-6">
      <h1 className="font-display text-2xl uppercase text-coal">
        {t("About", "Nosotros", lang)}
      </h1>
      <div className="aspect-[4/3] rounded-[18px] bg-blush/30 flex items-center justify-center text-coal/40 text-sm">
        {t("Photo coming soon", "Foto próximamente", lang)}
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-coal/85">
        <p>
          {t(
            "Hi, I'm the baker behind Sweetbites. I started this kitchen because I missed the kind of cookies my abuela used to make — crisp edges, soft centers, and nothing from a mix.",
            "Hola, soy la panadera detrás de Sweetbites. Abrí esta cocina porque extrañaba las galletas que hacía mi abuela — bordes crujientes, centro suave, nada de mezclas.",
            lang,
          )}
        </p>
        <p>
          {t(
            "Every batch is small, every order is made to order, and every box leaves the oven the same day you pick it up or we deliver it across Toronto.",
            "Cada lote es pequeño, cada pedido se hace al momento, y cada caja sale del horno el mismo día que la recoges o te la entregamos en Toronto.",
            lang,
          )}
        </p>
      </div>
    </div>
  );
}
