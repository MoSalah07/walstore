"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import { cn } from "@/lib/utils";

// Thumbs on the start side (desktop) or dots below (phone); white stage with
// the deal badge and a zoom button.
export default function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: React.ReactNode;
}) {
  const t = useTranslations("Product");
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const src = images[selected] ?? images[0];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-4">
      {images.length > 1 && (
        <div className="order-2 hidden flex-col gap-3 md:order-none md:flex">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
              aria-label={t("Show image n", { n: i + 1 })}
              aria-pressed={selected === i}
              className={cn(
                "relative size-20 overflow-hidden rounded-[14px] border bg-white transition-colors duration-fast",
                selected === i ? "border-2 border-primary dark:border-foreground" : "border-border hover:border-foreground"
              )}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex h-[340px] flex-1 items-center justify-center rounded-2xl border border-border bg-white md:h-[480px] lg:h-[600px]">
        <ControlledZoom isZoomed={zoomed} onZoomChange={setZoomed} a11yNameButtonZoom={t("Zoom image")}>
          <span className="relative block h-[280px] w-[280px] md:h-[400px] md:w-[400px] lg:h-[480px] lg:w-[440px]">
            <Image src={src} alt={name} fill priority sizes="(min-width: 1024px) 440px, 80vw" className="object-contain" />
          </span>
        </ControlledZoom>
        {badge && <div className="absolute start-4 top-4 md:start-5 md:top-5">{badge}</div>}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={t("Zoom image")}
          className="absolute bottom-4 end-4 hidden size-11 items-center justify-center rounded-full border border-border bg-white text-[#0B0D12] transition-colors duration-fast hover:border-[#0B0D12] md:bottom-5 md:end-5 md:flex"
        >
          <ZoomIn className="size-[18px]" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden" role="group" aria-label={t("Images")}>
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={t("Show image n", { n: i + 1 })}
              aria-pressed={selected === i}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-base",
                  selected === i ? "w-5 bg-foreground" : "w-1.5 bg-input"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
