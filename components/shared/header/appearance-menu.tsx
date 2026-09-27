"use client";

import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { BrandSwatch } from "@/components/shared/theme/brand-picker";
import { COLOR_MODES, MODE_ICONS } from "@/components/shared/theme/options";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useBrand from "@/hooks/use-brand";
import useMounted from "@/hooks/use-mounted";
import { BRANDS, isBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

// Keeps the menu open so people can compare options in place.
const stayOpen = (e: Event) => e.preventDefault();

// Header menu: colour mode (light/dark/system) + brand colour.
export default function AppearanceMenu({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const { brand, setBrand } = useBrand();
  const mounted = useMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Appearance")}
        className={cn(
          "flex size-11 items-center justify-center rounded-full text-foreground transition-colors duration-fast hover:bg-sunken data-[state=open]:bg-sunken",
          className
        )}
      >
        <Palette className="size-5" strokeWidth={1.8} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t("Mode")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mounted ? theme : ""} onValueChange={setTheme}>
          {COLOR_MODES.map((mode) => {
            const Icon = MODE_ICONS[mode];
            return (
              <DropdownMenuRadioItem key={mode} value={mode} onSelect={stayOpen} className="gap-2.5">
                <Icon className="size-4 text-foreground-secondary" strokeWidth={1.8} aria-hidden />
                {t(mode)}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("Color")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={brand ?? ""}
          onValueChange={(value) => isBrand(value) && setBrand(value)}
        >
          {BRANDS.map((b) => (
            <DropdownMenuRadioItem key={b} value={b} onSelect={stayOpen} className="gap-2.5">
              <BrandSwatch brand={b} className="ring-popover" />
              {t(b)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
