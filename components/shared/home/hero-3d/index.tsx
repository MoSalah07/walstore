"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { onThemeChange, readRgbToken } from "@/lib/theme-tokens";
import { cn } from "@/lib/utils";
import type { HeroPalette, HeroScene } from "./scene";

// The scene takes its colours from the design tokens.
function readHeroPalette(): HeroPalette | null {
  const ground = readRgbToken("inverse");
  const accent = readRgbToken("inverse-accent");
  const paper = readRgbToken("media-paper");
  return ground && accent && paper ? { ground, accent, paper } : null;
}

// 3D "glass portal" hero beside the copy. Three.js loads lazily, restyles
// live with the brand and colour mode, honours prefers-reduced-motion and
// falls back to a photo without WebGL.
export default function Hero3D({
  photos,
  dir,
  fallback,
}: {
  photos: string[];
  dir: "ltr" | "rtl";
  fallback: React.ReactNode;
}) {
  const t = useTranslations("Home");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HeroScene | null>(null);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;
    let disposed = false;
    let cleanup = () => {};

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pausedRef.current = true;
      setPaused(true);
    }

    import("./scene")
      .then(({ createHeroScene }) => {
        if (disposed) return;
        const scene = createHeroScene({
          canvas,
          photos,
          dir,
          palette: readHeroPalette(),
          paused: pausedRef.current,
        });
        const stopWatchingTheme = onThemeChange(() => {
          const palette = readHeroPalette();
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
  }, [photos, dir]);

  useEffect(() => {
    sceneRef.current?.setPaused(paused);
  }, [paused]);

  if (status === "failed") return <>{fallback}</>;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-slow ease-standard",
          status === "ready" ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="absolute bottom-6 end-6 z-10 flex items-center gap-2">
        <span className="hidden h-10 items-center rounded-full bg-inverse/60 px-4 text-xs text-inverse-foreground/80 shadow-[inset_0_0_0_1px_rgb(var(--inverse-foreground)/0.1)] backdrop-blur-md lg:flex">
          {t("Move your cursor")}
        </span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? t("Play animation") : t("Pause animation")}
          className="flex size-10 items-center justify-center rounded-full bg-inverse/60 text-inverse-foreground backdrop-blur-md shadow-[inset_0_0_0_1px_rgb(var(--inverse-foreground)/0.16)] transition-colors duration-fast hover:bg-inverse-foreground/15"
        >
          {paused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
        </button>
      </div>
    </>
  );
}
