"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatOrderCalendarDate, isBlockedOrderDate } from "@/lib/order-calendar";
import { t } from "@/lib/format";
import { isAllowedWantedOn, localDateIso, minWantedOnIso } from "@/lib/shop";
import type { Lang } from "@/lib/types";

type Props = {
  lang: Lang;
  value: string;
  blockedDates: string[];
  onChange: (iso: string) => void;
  onBlockedPick?: () => void;
  id?: string;
};

function monthMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(localDateIso(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function displayValue(iso: string, lang: Lang): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "es" ? "es-CA" : "en-CA", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function CompactOrderDateField({ lang, value, blockedDates, onChange, onBlockedPick, id }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const minIso = minWantedOnIso();
  const [y0, m0] = minIso.split("-").map(Number);
  const seed = value && value >= minIso ? value.split("-").map(Number) : [y0, m0];
  const [viewYear, setViewYear] = useState(seed[0]);
  const [viewMonth, setViewMonth] = useState(seed[1] - 1);

  const cells = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthTitle = new Intl.DateTimeFormat(lang === "es" ? "es-CA" : "en-CA", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth, 1));

  const minMonth = m0 - 1;
  const canPrev = viewYear > y0 || (viewYear === y0 && viewMonth > minMonth);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!value || !open) return;
    const [y, m] = value.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }, [open, value]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pick = (iso: string) => {
    if (isBlockedOrderDate(iso, blockedDates)) {
      onBlockedPick?.();
      return;
    }
    if (!isAllowedWantedOn(iso, new Date(), blockedDates)) return;
    onChange(iso);
    setOpen(false);
  };

  const weekdays = lang === "es" ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className="input-field w-full text-left"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {value ? displayValue(value, lang) : t("Pick a date", "Elige una fecha", lang)}
      </button>
      <input type="hidden" name="wantedOn" value={value} required />

      {open ? (
        <div
          role="dialog"
          aria-label={t("Choose date", "Elegir fecha", lang)}
          className="absolute left-0 z-50 mt-1 w-[17.5rem] rounded-lg border border-coal/10 bg-white p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-coal">
            <span>{monthTitle}</span>
            <span className="flex gap-0.5">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => shiftMonth(-1)}
                className="rounded px-1.5 py-0.5 text-coal/60 hover:bg-blush/20 disabled:opacity-30"
                aria-label={t("Previous month", "Mes anterior", lang)}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded px-1.5 py-0.5 text-coal/60 hover:bg-blush/20"
                aria-label={t("Next month", "Mes siguiente", lang)}
              >
                ▼
              </button>
            </span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-coal/45">
            {weekdays.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-0.5 grid grid-cols-7 gap-0.5">
            {cells.map((iso, i) => {
              if (!iso) return <span key={`e-${i}`} className="h-8" aria-hidden />;
              const blocked = isBlockedOrderDate(iso, blockedDates);
              const allowed = isAllowedWantedOn(iso, new Date(), blockedDates);
              const selected = iso === value;
              const day = Number(iso.slice(8, 10));
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!allowed && !blocked}
                  onClick={() => pick(iso)}
                  className={`h-8 rounded text-sm ${
                    selected
                      ? "bg-berry text-white"
                      : blocked
                        ? "text-coal/35 line-through decoration-coal/50"
                        : allowed
                          ? "text-coal hover:bg-blush/25"
                          : "text-coal/20"
                  }`}
                  aria-label={formatOrderCalendarDate(iso, lang)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
