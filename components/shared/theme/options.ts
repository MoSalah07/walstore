import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

// Colour modes offered by next-themes (see components/providers/theme-provider).
export const COLOR_MODES = ["light", "dark", "system"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export const MODE_ICONS: Record<ColorMode, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

// Pill used by the mode and brand pickers; Radix sets data-state="checked".
export const choiceChip =
  "inline-flex h-9 items-center gap-2 rounded-full border border-input bg-card px-3.5 text-[13px] font-semibold text-foreground transition-colors duration-fast hover:border-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground [&_svg]:size-4 [&_svg]:shrink-0";
