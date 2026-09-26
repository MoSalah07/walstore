import { i18n } from "./i18n-confige";
import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: i18n.locales.map((locale) => locale.code),
  defaultLocale: "en",
});

// Locale-aware navigation: prefer these over next/link and next/navigation.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
