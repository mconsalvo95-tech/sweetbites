"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import {
  allHoursLines,
  shop,
  todayHoursLine,
} from "@/lib/shop";
import { SocialLinks } from "./SocialLinks";

type ContactModalContextValue = {
  openContact: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export function useContactModal(): ContactModalContextValue {
  const ctx = useContext(ContactModalContext);
  if (!ctx) throw new Error("useContactModal must be used within ContactModalProvider");
  return ctx;
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openContact = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openContact }), [openContact]);

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </ContactModalContext.Provider>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
      <path d="M4.5 2.25H7L8.25 5.25L6.75 6.25C7.55 8.05 9.2 9.7 11 10.5L12 9L15 10.25V12.75C15 13.15 14.65 13.5 14.25 13.5C8.1 13.05 3.45 8.4 3 2.25C3 1.85 3.35 1.5 3.75 1.5H4.5V2.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
      <circle cx="9" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 5.25V9L11.25 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const actions = [
  { key: "menu", href: "/order", labelEn: "View menu", labelEs: "Ver menús", external: false },
  { key: "order", href: "/order", labelEn: "Order", labelEs: "Pedir", external: false },
  { key: "call", href: shop.phoneTel, labelEn: "Call", labelEs: "Llamar", external: true },
  { key: "whatsapp", href: shop.whatsapp, labelEn: "WhatsApp", labelEs: "WhatsApp", external: true },
  { key: "instagram", href: shop.instagram, labelEn: "Instagram", labelEs: "Instagram", external: true },
] as const;

function ActionIcon({ actionKey }: { actionKey: (typeof actions)[number]["key"] }) {
  switch (actionKey) {
    case "menu":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M3 4.5H15M3 9H15M3 13.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "order":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M5 6V4.5C5 3.12 6.12 2 7.5 2H10.5C11.88 2 13 3.12 13 4.5V6M4 6H14L13 15.5C13 16.05 12.55 16.5 12 16.5H6C5.45 16.5 5 16.05 5 15.5L4 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "call":
      return <PhoneIcon />;
    case "whatsapp":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.5 2 2 6.4 2 11.8c0 2.1.7 4 1.8 5.6L2 22l4.8-1.6c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.4 10-9.9S17.5 2 12 2zm5.4 11.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.1-.3.2-.5.1-1-.4-1.9-1.1-2.5-2-.2-.3 0-.4.1-.6l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.8 3.4 1.4.6 1.7.5 2.3.4.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.1-.4-.2z" />
        </svg>
      );
    case "instagram":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      );
  }
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setHoursExpanded(false);
      setActionsOpen(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!actionsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [actionsOpen]);

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="modal-panel relative z-10 w-full max-w-[400px] rounded-[20px] bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={shop.name}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-coal/50 hover:text-coal"
          aria-label={t("Close", "Cerrar", lang)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-start justify-between gap-3 pr-8">
          <h2 className="text-lg font-semibold">{shop.name}</h2>
          <span className="shrink-0 rounded-full bg-berry px-2.5 py-0.5 text-xs font-medium text-white">
            {t("Current shop", "Sede actual", lang)}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-sm text-coal/85">
          <div className="flex gap-3">
            <PhoneIcon />
            <a href={shop.phoneTel} className="hover:text-berry">{shop.phoneDisplay}</a>
          </div>
          <div className="flex gap-3">
            <ClockIcon />
            <div>
              <p>{todayHoursLine(lang)}</p>
              {!hoursExpanded ? (
                <button
                  type="button"
                  onClick={() => setHoursExpanded(true)}
                  className="mt-0.5 text-berry underline underline-offset-2"
                >
                  {t("See more…", "Ver más…", lang)}
                </button>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {allHoursLines(lang).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <SocialLinks lang={lang} className="mt-5" />

        <div className="relative mt-6">
          <button
            type="button"
            onClick={() => setActionsOpen((v) => !v)}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-full bg-berry px-5 py-3 text-sm font-medium text-white hover:bg-berry-hover"
            aria-expanded={actionsOpen}
          >
            {t("Actions", "Acciones", lang)}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className={`transition-transform ${actionsOpen ? "rotate-180" : ""}`}
            >
              <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {actionsOpen && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-blush/40 bg-white py-1 shadow-lg">
              {actions.map((action) => (
                <li key={action.key}>
                  {action.external ? (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-blush/40"
                      onClick={onClose}
                    >
                      <span>{lang === "es" ? action.labelEs : action.labelEn}</span>
                      <ActionIcon actionKey={action.key} />
                    </a>
                  ) : (
                    <Link
                      href={action.href}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-blush/40"
                      onClick={onClose}
                    >
                      <span>{lang === "es" ? action.labelEs : action.labelEn}</span>
                      <ActionIcon actionKey={action.key} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
