import { t } from "@/lib/format";

type ChristmasBagBarProps = {
  lang: "en" | "es";
  bagCount: number;
  toast: string | null;
};

export function ChristmasBagBar({ lang, bagCount, toast }: ChristmasBagBarProps) {
  return (
    <div className="sticky top-[4.25rem] z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[#c4a35a]/25 bg-[#fffaf8]/95 px-4 py-2.5 shadow-sm backdrop-blur-sm sm:px-6">
      <p
        className="rounded-full border border-[#1f6b4a]/25 bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#1f4d32] shadow-sm ring-1 ring-[#c4a35a]/30"
        aria-live="polite"
      >
        {t("Christmas bag", "Bolsa de Navidad", lang)} · {bagCount}
      </p>
      {toast ? (
        <p className="text-sm font-medium text-[#1f6b4a]" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
