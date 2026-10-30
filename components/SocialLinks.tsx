import { shop } from "@/lib/shop";
import { t } from "@/lib/format";
import type { Lang } from "@/lib/types";

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.5 2 2 6.4 2 11.8c0 2.1.7 4 1.8 5.6L2 22l4.8-1.6c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.4 10-9.9S17.5 2 12 2zm0 18.1c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3.1 1 1-3-.2-.3A8 8 0 0 1 4 11.8C4 7.5 7.6 4 12 4s8 3.5 8 7.8-3.6 8.3-8 8.3zm4.4-6.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.1-.3.2-.5.1-1-.4-1.9-1.1-2.5-2-.2-.3 0-.4.1-.6l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.8 3.4 1.4.6 1.7.5 2.3.4.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.1-.4-.2z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 36 36" aria-hidden>
      <path
        fill="#1877F2"
        d="M36 18C36 8.06 27.94 0 18 0S0 8.06 0 18c0 8.98 6.58 16.42 15.17 17.74V23.2h-4.57V18h4.57v-3.97c0-4.51 2.69-7 6.8-7 1.97 0 4.03.35 4.03.35v4.43h-2.27c-2.24 0-2.94 1.39-2.94 2.81V18h5l-.8 5.2h-4.2v12.54C29.42 34.42 36 26.98 36 18z"
      />
      <path
        fill="#fff"
        d="M25.04 23.2l.8-5.2h-5v-3.38c0-1.42.7-2.81 2.94-2.81H26V7.38s-2.06-.35-4.03-.35c-4.11 0-6.8 2.49-6.8 7V18H10.6v5.2h4.57v12.54a18.2 18.2 0 0 0 5.66 0V23.2h4.21z"
      />
    </svg>
  );
}

export function SocialLinks({ lang, className = "" }: { lang: Lang; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href={shop.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 origin-center items-center justify-center rounded-full bg-berry text-white transition-transform hover:scale-105 active:scale-95"
        aria-label={t("Instagram", "Instagram", lang)}
      >
        <InstagramIcon />
      </a>
      <a
        href={shop.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 origin-center items-center justify-center overflow-hidden rounded-full transition-transform hover:scale-105 active:scale-95"
        aria-label={t("Facebook", "Facebook", lang)}
      >
        <FacebookIcon />
      </a>
      <a
        href={shop.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 origin-center items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105 active:scale-95"
        aria-label={t("WhatsApp", "WhatsApp", lang)}
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}
