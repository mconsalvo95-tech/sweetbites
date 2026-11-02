"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SpecialItemCard } from "@/components/SpecialItemCard";
import { useLang } from "@/lib/lang";
import { localDateIso } from "@/lib/shop";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  DEFAULT_SPECIALS,
  mergeSpecialsBody,
  specialIsVisible,
  type SpecialsBody,
} from "@/lib/specials";

export function SpecialsSection({ initial }: { initial?: SpecialsBody | null }) {
  const { lang } = useLang();
  const [body, setBody] = useState<SpecialsBody>(initial ? mergeSpecialsBody(initial) : DEFAULT_SPECIALS);
  const [loaded, setLoaded] = useState(Boolean(initial));

  useEffect(() => {
    if (initial) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoaded(true);
      return;
    }
    void supabase
      .from("site_pages")
      .select("body")
      .eq("slug", "specials")
      .maybeSingle()
      .then(({ data }) => {
        setBody(mergeSpecialsBody(data?.body));
        setLoaded(true);
      });
  }, [initial]);

  if (!loaded) return null;

  const today = localDateIso();
  if (!specialIsVisible(body, today)) return null;

  const title = lang === "es" ? body.title_es || body.title_en : body.title_en || body.title_es;
  const message = lang === "es" ? body.message_es || body.message_en : body.message_en || body.message_es;
  const items = body.items.filter((row) => row.name_en.trim() || row.name_es.trim());

  const bannerUrl = body.image_url.trim();

  return (
    <section className="rounded-[18px] border border-blush/50 bg-white p-5 shadow-sm">
      {bannerUrl ? (
        <div className="relative mb-4 max-h-48 w-full overflow-hidden rounded-xl">
          <Image
            src={bannerUrl}
            alt={title}
            width={800}
            height={320}
            unoptimized={bannerUrl.startsWith("http")}
            className="max-h-48 w-full object-cover"
          />
        </div>
      ) : null}
      <h2 className="font-display text-lg uppercase text-berry">{title}</h2>
      {message ? <p className="mt-2 text-sm leading-relaxed text-coal/85">{message}</p> : null}
      <p className="mt-2 text-xs text-coal/50">
        {body.starts_on} — {body.ends_on}
      </p>
      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((row, i) => {
            const name = lang === "es" ? row.name_es || row.name_en : row.name_en || row.name_es;
            const note = lang === "es" ? row.note_es || row.note_en : row.note_en || row.note_es;
            return (
              <SpecialItemCard
                key={`${name}-${i}`}
                name={name}
                note={note || undefined}
                priceCents={row.price_cents}
                imageUrl={row.image_url}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
