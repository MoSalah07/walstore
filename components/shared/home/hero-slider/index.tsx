"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Hand, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { onThemeChange, readRgbToken } from "@/lib/theme-tokens";
import { cn } from "@/lib/utils";
import type { SliderPalette, SliderScene } from "./scene";

export type HeroSlide = {
  id: string;
  /** Short name for the pagination. */
  label: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
  /** Portrait editorial photo (2:3 works best). */
  image: string;
  tone: "accent" | "deal";
};

const DURATION = 6500; // ms per slide

function readPalette(): SliderPalette | null {
  const ground = readRgbToken("inverse");
  const accent = readRgbToken("inverse-accent");
  const deal = readRgbToken("deal");
  return ground && accent && deal ? { ground, accent, deal } : null;
}

// Glass controls on the dark hero.
const glass =
  "bg-inverse-foreground/[0.08] text-inverse-foreground shadow-[inset_0_0_0_1px_rgb(var(--inverse-foreground)/0.14)] backdrop-blur-md hover:bg-inverse-foreground/[0.16]";

// Landing hero: a WebGL rail of editorial cards (see ./scene) beside the
// slide copy. Autoplays with a progress bar, pauses on hover, focus and
// off-screen, respects prefers-reduced-motion, works by drag, keyboard and
// buttons, and falls back to a plain photo without WebGL.
export default function HeroSlider({ slides, dir }: { slides: HeroSlide[]; dir: "ltr" | "rtl" }) {
  const t = useTranslations("Home");
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SliderScene | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const elapsed = useRef(0);

  const go = useCallback((next: number) => setIndex(((next % total) + total) % total), [total]);

  // ── Scene ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;
    let disposed = false;
    let cleanup = () => {};
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("./scene")
      .then(({ createSliderScene }) => {
        if (disposed) return;
        const scene = createSliderScene({
          canvas,
          slides: slides.map(({ image, tone }) => ({ image, tone })),
          index: 0,
          dir,
          palette: readPalette(),
          reducedMotion,
          onSelect: (i) => setIndex(i),
        });
        const stopWatchingTheme = onThemeChange(() => {
          const palette = readPalette();
          if (palette) scene.setPalette(palette);
        });
        sceneRef.current = scene;
        setStatus("ready");
        cleanup = () => {
          stopWatchingTheme();
          scene.dispose();
          sceneRef.current = null;
        };
      })
      .catch(() => {
        if (!disposed) setStatus("failed");
      });

    return () => {
      disposed = true;
      cleanup();
    };
    // Slides come from the server and don't change while mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, total]);

  useEffect(() => {
    sceneRef.current?.goTo(index);
  }, [index]);

  // ── Autoplay ───────────────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    elapsed.current = 0;
    if (barRef.current) barRef.current.style.transform = "scaleX(0)";
  }, [index]);

  const running = playing && !held && inView && total > 1;
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Capped so a backgrounded tab doesn't skip slides on return.
      elapsed.current += Math.min(now - last, 100);
      last = now;
      const progress = Math.min(elapsed.current / DURATION, 1);
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      if (progress >= 1) go(index + 1);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, index, go]);

  if (total === 0) return null;

  // Arrow keys follow the reading direction.
  const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === forward) go(index + 1);
    else if (e.key === back) go(index - 1);
    else return;
    e.preventDefault();
  };

  const active = slides[index];
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <section
      ref={sectionRef}
      aria-roledescription={t("carousel")}
      aria-label={t("Hero label")}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
      className="relative isolate h-[580px] overflow-hidden rounded-2xl bg-inverse text-inverse-foreground md:h-[540px] md:rounded-3xl lg:h-[600px]"
    >
      {/* Photo stand-in while Three.js loads, and for good without WebGL. */}
      {status !== "ready" && (
        <div className="absolute inset-x-0 top-6 mx-auto aspect-[2/3] h-[46%] overflow-hidden rounded-[14px] md:inset-x-auto md:end-[12%] md:top-[9%] md:h-[74%] lg:end-[14%]">
          <Image key={active.image} src={active.image} alt="" fill priority={index === 0} sizes="(min-width: 768px) 320px, 60vw" className="object-cover motion-safe:animate-[fade-up_480ms_ease-out_both]" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "absolute inset-0 size-full touch-pan-y transition-opacity duration-slow ease-standard",
          status === "ready" ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Keeps the copy legible over the scene. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[62%] bg-gradient-to-t from-inverse from-45% to-transparent md:hidden" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 z-[1] hidden w-[58%] bg-gradient-to-r from-inverse from-25% via-inverse/75 to-transparent md:block rtl:bg-gradient-to-l" />

      <div className="pointer-events-none relative z-[2] flex h-full flex-col px-5 pb-4 md:max-w-[540px] md:px-10 md:pb-7 lg:ps-16 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <div className="mt-auto md:my-auto" aria-live={running ? "off" : "polite"}>
          {slides.map((slide, i) => {
            // The first slide carries the page's h1.
            const Heading = i === 0 ? "h1" : "h2";
            return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription={t("slide")}
              aria-label={t("Slide n of total", { n: i + 1, total })}
              hidden={i !== index}
              className={cn("flex flex-col gap-3 md:gap-5", i !== index && "hidden")}
            >
              <span className="motion-safe:animate-rise flex h-7 items-center gap-2 self-start rounded-full bg-inverse-foreground/[0.08] pe-3 ps-2.5 text-xs font-semibold shadow-[inset_0_0_0_1px_rgb(var(--inverse-foreground)/0.14)] backdrop-blur-md md:h-8 md:text-[13px]">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    slide.tone === "deal"
                      ? "bg-deal shadow-[0_0_0_4px_rgb(var(--deal)/0.25)]"
                      : "bg-inverse-accent shadow-[0_0_0_4px_rgb(var(--inverse-accent)/0.22)]"
                  )}
                />
                {slide.eyebrow}
              </span>
              <Heading
                style={{ animationDelay: "90ms" }}
                className={cn(
                  "motion-safe:animate-rise bg-gradient-to-br from-inverse-foreground from-45% bg-clip-text pb-1 font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.035em] text-transparent md:text-[52px] lg:text-[62px] lg:leading-[0.98] lg:tracking-[-0.045em]",
                  slide.tone === "deal" ? "to-deal" : "to-inverse-accent"
                )}
              >
                {slide.title}
              </Heading>
              <p style={{ animationDelay: "180ms" }} className="motion-safe:animate-rise max-w-[420px] text-[15px] leading-relaxed text-inverse-muted md:text-[17px]">
                {slide.body}
              </p>
              <div style={{ animationDelay: "270ms" }} className="motion-safe:animate-rise mt-1 flex flex-wrap gap-2.5">
                <Link
                  href={slide.cta.href}
                  className={buttonVariants({
                    variant: slide.tone === "deal" ? "deal" : "inverse",
                    size: "lg",
                    className: "md:h-12 md:px-6 md:text-[15px]",
                  })}
                >
                  {slide.cta.label}
                  <ArrowRight className="rtl:rotate-180" aria-hidden />
                </Link>
                {slide.secondary && (
                  <Link
                    href={slide.secondary.href}
                    className={buttonVariants({ variant: "ghost", size: "lg", className: cn(glass, "hidden md:inline-flex md:h-12 md:px-6 md:text-[15px]") })}
                  >
                    {slide.secondary.label}
                  </Link>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Pagination with autoplay progress, then arrows and play/pause. */}
        <div className="mt-5 flex items-center gap-3 md:mt-0 md:gap-4">
          <div className="grid flex-1 auto-cols-fr grid-flow-col gap-1.5" aria-label={t("Choose slide")} role="group">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={slide.label}
                aria-current={i === index ? "true" : undefined}
                className="group flex min-w-0 flex-col gap-2 py-2.5 text-start"
              >
                <span className="hidden truncate text-xs font-semibold text-inverse-muted transition-colors duration-fast group-hover:text-inverse-foreground group-aria-[current]:text-inverse-foreground lg:block">
                  {slide.label}
                </span>
                <span className="relative h-[3px] overflow-hidden rounded-full bg-inverse-foreground/20 group-aria-[current]:bg-inverse-foreground/30">
                  {i === index && (
                    <span
                      ref={barRef}
                      className={cn(
                        "absolute inset-0 origin-left rounded-full bg-inverse-foreground rtl:origin-right",
                        !playing && "!scale-x-100"
                      )}
                      style={{ transform: "scaleX(0)" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <span dir="ltr" className="hidden font-display text-sm font-bold tabular-nums text-inverse-muted md:block" aria-hidden>
            <span className="text-inverse-foreground">{String(index + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => go(index - 1)} aria-label={t("Previous slide")} className={buttonVariants({ variant: "ghost", size: "icon-md", shape: "pill", className: glass })}>
              <Prev />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={t("Next slide")} className={buttonVariants({ variant: "ghost", size: "icon-md", shape: "pill", className: glass })}>
              <Next />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={!playing}
              aria-label={playing ? t("Pause slideshow") : t("Play slideshow")}
              className={buttonVariants({ variant: "ghost", size: "icon-md", shape: "pill", className: glass })}
            >
              {playing ? <Pause className="!size-3.5 fill-current" /> : <Play className="!size-3.5 fill-current" />}
            </button>
          </div>
        </div>
      </div>

      {status === "ready" && (
        <span className="pointer-events-none absolute end-6 top-6 z-[2] hidden h-8 items-center gap-2 rounded-full bg-inverse/50 px-3 text-xs text-inverse-foreground/80 shadow-[inset_0_0_0_1px_rgb(var(--inverse-foreground)/0.1)] backdrop-blur-md lg:flex">
          <Hand className="size-3.5" aria-hidden />
          {t("Drag to browse")}
        </span>
      )}
    </section>
  );
}
