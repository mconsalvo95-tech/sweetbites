"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export type HomeSlide = {
  imageUrl: string;
  tagEn?: string;
  tagEs?: string;
  titleEn?: string;
  titleEs?: string;
  offerEn?: string;
  offerEs?: string;
  quoteEn?: string;
  quoteEs?: string;
  name?: string;
  cityEn?: string;
  cityEs?: string;
  ctaHref?: string;
};

type HomeSliderProps = {
  slides: HomeSlide[];
  variant: "promo" | "review";
  ariaLabelEn: string;
  ariaLabelEs: string;
};

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 48;

export function HomeSlider({ slides, variant, ariaLabelEn, ariaLabelEs }: HomeSliderProps) {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || dragging || reducedMotion || slides.length <= 1) return;
    const id = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, dragging, reducedMotion, goNext, slides.length]);

  const finishDrag = useCallback(() => {
    if (Math.abs(dragDelta.current) >= SWIPE_THRESHOLD) {
      if (dragDelta.current > 0) goPrev();
      else goNext();
    }
    dragDelta.current = 0;
    setDragging(false);
  }, [goNext, goPrev]);

  const onPointerDown = (clientX: number) => {
    dragStartX.current = clientX;
    dragDelta.current = 0;
    setDragging(true);
  };

  const onPointerMove = (clientX: number) => {
    if (!dragging) return;
    dragDelta.current = clientX - dragStartX.current;
  };

  const label = t(ariaLabelEn, ariaLabelEs, lang);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        if (dragging) finishDrag();
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={finishDrag}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseUp={finishDrag}
        onMouseLeave={() => {
          if (dragging) finishDrag();
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <article
              key={i}
              className="relative aspect-[16/7] min-h-[220px] w-full min-w-full shrink-0 basis-full sm:min-h-[280px]"
              aria-hidden={i !== index}
            >
              <Image
                src={slide.imageUrl}
                alt=""
                fill
                unoptimized={slide.imageUrl.startsWith("http")}
                className="object-cover object-center"
                sizes="100vw"
                priority={i === 0}
              />
              {variant === "promo" ? (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-berry/80 via-berry/55 to-blush/40" />
              )}

              <div className={`absolute inset-0 flex flex-col justify-end px-12 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-8 ${
                variant === "promo" ? "items-center text-center sm:items-start sm:text-left" : ""
              }`}>
                {variant === "promo" ? (
                  <>
                    {(slide.tagEn || slide.tagEs) && (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-wide text-coal">
                        {t(slide.tagEn ?? "", slide.tagEs ?? "", lang)}
                      </span>
                    )}
                    <h3 className="font-display text-2xl uppercase leading-tight text-white sm:text-3xl">
                      {t(slide.titleEn ?? "", slide.titleEs ?? "", lang)}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">
                      {t(slide.offerEn ?? "", slide.offerEs ?? "", lang)}
                    </p>
                    {slide.ctaHref && (
                      <Link
                        href={slide.ctaHref}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="btn-primary mt-4 inline-flex w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-berry"
                      >
                        {t("Order now", "Pedir ahora", lang)}
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <p className="max-w-2xl text-lg font-medium leading-snug text-white sm:text-xl">
                      &ldquo;{t(slide.quoteEn ?? "", slide.quoteEs ?? "", lang)}&rdquo;
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white/90">
                      {slide.name}
                      {(slide.cityEn || slide.cityEs) && (
                        <span className="font-normal text-white/75">
                          {" "}
                          · {t(slide.cityEn ?? "", slide.cityEs ?? "", lang)}
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-coal shadow transition hover:bg-white"
              aria-label={t("Previous slide", "Diapositiva anterior", lang)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-coal shadow transition hover:bg-white"
              aria-label={t("Next slide", "Siguiente diapositiva", lang)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label={t("Slide dots", "Puntos de diapositiva", lang)}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={t(`Go to slide ${i + 1}`, `Ir a diapositiva ${i + 1}`, lang)}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-berry" : "w-2 bg-blush"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
