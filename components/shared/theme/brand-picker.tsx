"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { useTranslations } from "next-intl";

import useBrand from "@/hooks/use-brand";
import { Brand, BRANDS, isBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { choiceChip } from "./options";

// A dot in the brand's primary colour. `data-brand` scopes that brand's
// tokens to the dot, so it always shows its own colour in the current mode.
export function BrandSwatch({ brand, className }: { brand: Brand; className?: string }) {
  return (
    <span
      data-brand={brand}
      aria-hidden
      className={cn("size-4 shrink-0 rounded-full bg-primary ring-2 ring-card", className)}
    />
  );
}

// Black · Red · Blue as a row of chips.
export default function BrandPicker({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  const { brand, setBrand } = useBrand();

  return (
    <RadioGroup.Root
      value={brand ?? ""}
      onValueChange={(value) => isBrand(value) && setBrand(value)}
      aria-label={t("Color")}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {BRANDS.map((b) => (
        <RadioGroup.Item key={b} value={b} className={cn(choiceChip, "ps-2.5")}>
          <BrandSwatch brand={b} />
          {t(b)}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
