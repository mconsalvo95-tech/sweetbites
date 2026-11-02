"use client";

import { useCallback } from "react";

import { t } from "@/lib/format";

export type BoxTreatId =
  | "brownie"
  | "cookie"
  | "gingerbread"
  | "cupcake"
  | "chocolate"
  | "truffle";

const MAX_BOX = 6;

export const BOX_TREATS: {
  id: BoxTreatId;
  nameEn: string;
  nameEs: string;
  color: string;
  accent?: string;
}[] = [
  { id: "brownie", nameEn: "Brownie", nameEs: "Brownie", color: "#5c3d2e" },
  { id: "cookie", nameEn: "Cookie", nameEs: "Galleta", color: "#d4a574" },
  { id: "gingerbread", nameEn: "Gingerbread", nameEs: "Jengibre", color: "#b8860b" },
  { id: "cupcake", nameEn: "Cupcake", nameEs: "Cupcake", color: "#e7aca7", accent: "#aa1d50" },
  { id: "chocolate", nameEn: "Chocolate bite", nameEs: "Bocado de chocolate", color: "#3d2314" },
  { id: "truffle", nameEn: "Christmas truffle", nameEs: "Trufa navideña", color: "#8f1744" },
];

function treatMeta(id: BoxTreatId) {
  return BOX_TREATS.find((x) => x.id === id)!;
}

function OpenGiftBox({
  items,
  full,
  onRemoveAt,
  lang,
}: {
  items: BoxTreatId[];
  full: boolean;
  onRemoveAt: (index: number) => void;
  lang: "en" | "es";
}) {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <svg viewBox="0 0 240 200" className="h-auto w-full" aria-hidden>
        <ellipse cx="120" cy="178" rx="95" ry="12" fill="#1f4d32" opacity="0.15" />
        <path d="M30 90 L30 165 Q30 175 45 175 L195 175 Q210 175 210 165 L210 90 Z" fill="#fffaf8" stroke="#c4a35a" strokeWidth="2" />
        <path d="M25 85 L215 85 L210 95 L30 95 Z" fill="#1f6b4a" opacity="0.85" />
        {full ? (
          <>
            <rect x="108" y="72" width="24" height="95" fill="#aa1d50" />
            <path d="M120 72 C95 72 88 55 105 48 C115 44 120 58 120 65 C120 58 125 44 135 48 C152 55 145 72 120 72" fill="#c4a35a" />
          </>
        ) : (
          <path d="M120 85 L120 55" stroke="#c4a35a" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
        )}
      </svg>
      <ul className="absolute inset-x-0 bottom-[4.5rem] top-[4.5rem] mx-auto grid max-w-[11rem] list-none grid-cols-3 gap-1.5 px-2">
        {Array.from({ length: MAX_BOX }, (_, slot) => {
          const treatId = items[slot];
          if (!treatId) {
            return (
              <li
                key={slot}
                className="rounded-lg border border-dashed border-[#c4a35a]/40 bg-white/40"
                aria-hidden
              />
            );
          }
          const meta = treatMeta(treatId);
          return (
            <li key={`${slot}-${treatId}`}>
              <button
                type="button"
                className="flex h-full min-h-[2.75rem] w-full flex-col items-center justify-center rounded-lg border border-[#1f4d32]/20 shadow-sm transition hover:scale-105 hover:ring-2 hover:ring-[#c4a35a]"
                style={{ backgroundColor: meta.color }}
                title={meta.nameEn}
                aria-label={t(
                  `Remove ${meta.nameEn} from box`,
                  `Quitar ${meta.nameEs} de la caja`,
                  lang,
                )}
                onClick={() => onRemoveAt(slot)}
              >
                <span className="sr-only">{t(meta.nameEn, meta.nameEs, lang)}</span>
                {meta.accent ? (
                  <span className="h-2 w-2 rounded-full bg-white/80" aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ChristmasBoxBuilderProps = {
  lang: "en" | "es";
  boxItems: BoxTreatId[];
  onBoxChange: (items: BoxTreatId[]) => void;
  onAddBoxToBag: () => void;
};

export function ChristmasBoxBuilder({
  lang,
  boxItems,
  onBoxChange,
  onAddBoxToBag,
}: ChristmasBoxBuilderProps) {
  const count = boxItems.length;
  const full = count >= MAX_BOX;

  const addTreat = useCallback(
    (id: BoxTreatId) => {
      if (boxItems.length >= MAX_BOX) return;
      onBoxChange([...boxItems, id]);
    },
    [boxItems, onBoxChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      onBoxChange(boxItems.filter((_, i) => i !== index));
    },
    [boxItems, onBoxChange],
  );

  return (
    <section id="christmas-box" className="scroll-mt-24 bg-[#f5f0eb] px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-display text-2xl uppercase text-[#8f1744] sm:text-3xl">
            {t("Build your Christmas box", "Arma tu caja de Navidad", lang)}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-coal/75 sm:text-base">
            {t(
              "Choose your favourite festive treats and create a gift wrapped in SweetBites magic.",
              "Elige tus dulces festivos favoritos y crea un regalo envuelto en magia SweetBites.",
              lang,
            )}
          </p>
          <p className="mt-4 text-sm font-bold tabular-nums text-[#1f4d32]" aria-live="polite">
            {t("Your box:", "Tu caja:", lang)} {count} / {MAX_BOX}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#1f6b4a]">
              {t("Pick a treat", "Elige un dulce", lang)}
            </p>
            <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3">
              {BOX_TREATS.map((treat) => (
                <li key={treat.id}>
                  <button
                    type="button"
                    disabled={full}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-[#c4a35a]/30 bg-white p-3 shadow-sm transition hover:border-[#1f6b4a] disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => addTreat(treat.id)}
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-lg shadow-inner"
                      style={{ backgroundColor: treat.color }}
                      aria-hidden
                    >
                      {treat.id === "gingerbread" ? (
                        <svg viewBox="0 0 24 24" className="h-7 w-7">
                          <circle cx="12" cy="10" r="7" fill="#c4a35a" />
                          <circle cx="9" cy="9" r="1" fill="#5c3d2e" />
                          <circle cx="15" cy="9" r="1" fill="#5c3d2e" />
                          <path d="M9 13 Q12 15 15 13" stroke="#5c3d2e" fill="none" strokeWidth="1" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="text-center text-xs font-semibold text-coal">
                      {t(treat.nameEn, treat.nameEs, lang)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-coal/55">
              {t(
                "Tap a sweet in your box to remove it.",
                "Toca un dulce en tu caja para quitarlo.",
                lang,
              )}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <OpenGiftBox items={boxItems} full={full} onRemoveAt={removeAt} lang={lang} />
            <button
              type="button"
              disabled={count === 0}
              className="btn-primary mt-6 w-full max-w-xs rounded-xl bg-[#8f1744] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-40 sm:w-auto"
              onClick={onAddBoxToBag}
            >
              {t("Add my Christmas box", "Agregar mi caja", lang)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
