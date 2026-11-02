"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isBlockedOrderDate } from "@/lib/order-calendar";
import { t } from "@/lib/format";
import { localDateIso } from "@/lib/shop";
import type { Lang } from "@/lib/types";

const ADMIN_CALENDAR_YEAR_MAX = 2099;

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

function orderedRange(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

function formatShort(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "es" ? "es-CA" : "en-CA", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function adminYearOptions(): number[] {
  const start = new Date().getFullYear() - 1;
  const len = ADMIN_CALENDAR_YEAR_MAX - start + 1;
  return Array.from({ length: len }, (_, i) => start + i);
}

/** Year control: closed field like month; open list shows ~4 rows, scroll for more (through 2099). */
function YearPickerDropdown({
  lang,
  years,
  value,
  onChange,
}: {
  lang: Lang;
  years: number[];
  value: number;
  onChange: (year: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    selectedRef.current?.scrollIntoView({ block: "nearest" });
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, value]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 rounded-lg border border-blush/60 bg-white px-2 py-1.5 text-sm text-coal"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("Year", "Año", lang)}
      >
        <span>{value}</span>
        <span className="text-[10px] text-coal/45" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-30 mt-1 max-h-[7.25rem] min-w-full overflow-y-auto rounded-lg border border-blush/60 bg-white py-0.5 shadow-md"
          role="listbox"
          aria-label={t("Year", "Año", lang)}
        >
          {years.map((year) => {
            const selected = year === value;
            return (
              <button
                key={year}
                ref={selected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(year);
                  setOpen(false);
                }}
                className={`block w-full whitespace-nowrap px-3 py-1.5 text-left text-sm ${
                  selected ? "bg-berry font-medium text-white" : "text-coal hover:bg-blush/25"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type PanelProps = {
  lang: Lang;
  blockedDates: string[];
  viewYear: number;
  viewMonth: number;
  setViewYear: (y: number) => void;
  setViewMonth: (m: number) => void;
  hint: ReactNode;
  headerExtra?: ReactNode;
  footerHint: ReactNode;
  onDayClick: (iso: string) => void;
  onDayHover?: (iso: string) => void;
  startIso?: string | null;
  preview?: [string, string] | null;
};

function BlockCalendarPanel({
  lang,
  blockedDates,
  viewYear,
  viewMonth,
  setViewYear,
  setViewMonth,
  hint,
  headerExtra,
  footerHint,
  onDayClick,
  onDayHover,
  startIso,
  preview,
}: PanelProps) {
  const cells = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);
  const locale = lang === "es" ? "es-CA" : "en-CA";
  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2020, i, 1)),
      ),
    [locale],
  );
  const yearOptions = useMemo(() => adminYearOptions(), []);
  const weekdays =
    lang === "es" ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-coal/70">{hint}</p>
        {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
      </div>
      <div className="mb-2 grid grid-cols-[1fr_5.5rem] gap-2">
        <select
          value={viewMonth}
          onChange={(e) => setViewMonth(Number(e.target.value))}
          className="w-full rounded-lg border border-blush/60 bg-white px-2 py-1.5 text-sm text-coal"
          aria-label={t("Month", "Mes", lang)}
        >
          {monthNames.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
        <YearPickerDropdown lang={lang} years={yearOptions} value={viewYear} onChange={setViewYear} />
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-coal/45">
        {weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5 select-none">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e-${i}`} className="h-8" aria-hidden />;
          const day = Number(iso.slice(8, 10));
          const blocked = isBlockedOrderDate(iso, blockedDates);
          const isStart = iso === startIso;
          const inPreview = preview ? iso >= preview[0] && iso <= preview[1] : false;
          return (
            <button
              key={iso}
              type="button"
              className={`h-8 rounded text-sm ${
                isStart
                  ? "bg-berry text-white"
                  : inPreview
                    ? "bg-berry/25 font-medium text-coal"
                    : blocked
                      ? "bg-blush/35 text-coal/45 line-through"
                      : "text-coal hover:bg-blush/20"
              }`}
              onClick={() => onDayClick(iso)}
              onMouseEnter={() => onDayHover?.(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-coal/50">{footerHint}</p>
    </>
  );
}

function usePopoverDismiss(open: boolean, onClose: () => void, rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, rootRef]);
}

type FieldProps = {
  lang: Lang;
  blockedDates: string[];
  fieldClassName: string;
};

export function AdminBlockSingleDayPicker({ lang, blockedDates, fieldClassName, onPick }: FieldProps & { onPick: (iso: string) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = localDateIso();
  const [y, m] = today.split("-").map(Number);
  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m - 1);
  const [lastLabel, setLastLabel] = useState("");
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const close = () => setOpen(false);
  usePopoverDismiss(open, close, rootRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${fieldClassName} w-full text-left ${lastLabel ? "text-coal" : "text-coal/45"}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {lastLabel || t("Pick a date", "Elegir una fecha", lang)}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={t("Block one day", "Bloquear un día", lang)}
          className="absolute left-0 z-50 mt-1 w-[19rem] max-w-[calc(100vw-2rem)] rounded-lg border border-coal/10 bg-white p-3 shadow-lg"
        >
          <BlockCalendarPanel
            lang={lang}
            blockedDates={blockedDates}
            viewYear={viewYear}
            viewMonth={viewMonth}
            setViewYear={setViewYear}
            setViewMonth={setViewMonth}
            hint={t("Click the day to block", "Clic en el día a bloquear", lang)}
            footerHint={t("Esc closes the calendar.", "Esc cierra el calendario.", lang)}
            onDayClick={(iso) => {
              onPickRef.current(iso);
              setLastLabel(formatShort(iso, lang));
              close();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function AdminBlockRangePicker({ lang, blockedDates, fieldClassName, onRangeComplete }: FieldProps & { onRangeComplete: (from: string, to: string) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = localDateIso();
  const [y, m] = today.split("-").map(Number);
  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m - 1);
  const [start, setStart] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [lastLabel, setLastLabel] = useState("");
  const onCompleteRef = useRef(onRangeComplete);
  onCompleteRef.current = onRangeComplete;

  const preview: [string, string] | null =
    start && hover ? orderedRange(start, hover) : start ? [start, start] : null;

  const resetPick = () => {
    setStart(null);
    setHover(null);
  };

  const closePopover = () => {
    setOpen(false);
    resetPick();
  };

  usePopoverDismiss(open, closePopover, rootRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (start) resetPick();
      else closePopover();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start]);

  const onDayClick = (iso: string) => {
    if (!start) {
      setStart(iso);
      setHover(iso);
      return;
    }
    const [from, to] = orderedRange(start, iso);
    onCompleteRef.current(from, to);
    setLastLabel(from === to ? formatShort(from, lang) : `${formatShort(from, lang)} – ${formatShort(to, lang)}`);
    closePopover();
  };

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${fieldClassName} w-full text-left ${lastLabel ? "text-coal" : "text-coal/45"}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {lastLabel || t("Pick a date range", "Elegir un rango de fechas", lang)}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={t("Block a date range", "Bloquear un rango de fechas", lang)}
          className="absolute left-0 z-50 mt-1 w-[19rem] max-w-[calc(100vw-2rem)] rounded-lg border border-coal/10 bg-white p-3 shadow-lg"
        >
          <BlockCalendarPanel
            lang={lang}
            blockedDates={blockedDates}
            viewYear={viewYear}
            viewMonth={viewMonth}
            setViewYear={setViewYear}
            setViewMonth={setViewMonth}
            hint={
              start
                ? t("2. Click your last day off", "2. Clic en el último día libre", lang)
                : t("1. Click your first day off", "1. Clic en el primer día libre", lang)
            }
            headerExtra={
              start ? (
                <button type="button" onClick={resetPick} className="text-xs font-medium text-coal/55 hover:text-berry">
                  {t("Reset", "Reiniciar", lang)}
                </button>
              ) : null
            }
            footerHint={
              start
                ? t("Preview with the mouse, then click the last day.", "Vista previa con el mouse y clic en el último día.", lang)
                : t("Esc closes the calendar.", "Esc cierra el calendario.", lang)
            }
            startIso={start}
            preview={preview}
            onDayClick={onDayClick}
            onDayHover={(iso) => {
              if (start) setHover(iso);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated import AdminBlockRangePicker */
export const AdminDragBlockRangeCalendar = AdminBlockRangePicker;
