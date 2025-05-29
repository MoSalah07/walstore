import { i18n } from "./i18n-confige";
import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: i18n.locales.map((locale) => locale.code),
  defaultLocale: "en",
  // localePrefix: "as-needed",
  pathnames: {
    // If all locales use the same pathname, a single
    // external path can be used for all locales
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
