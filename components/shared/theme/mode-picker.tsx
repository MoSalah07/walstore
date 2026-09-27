"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import useMounted from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { choiceChip, COLOR_MODES, MODE_ICONS } from "./options";

// Light · Dark · System as a row of chips.
export default function ModePicker({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <RadioGroup.Root
      value={mounted ? theme : ""}
      onValueChange={setTheme}
      aria-label={t("Mode")}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {COLOR_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode];
        return (
          <RadioGroup.Item key={mode} value={mode} className={choiceChip}>
            <Icon strokeWidth={1.8} aria-hidden />
            {t(mode)}
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
