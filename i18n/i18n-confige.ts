export const i18n = {
  locales: [
    { code: "en", name: "English", icon: "🇺🇸" },
    { code: "ar", name: "العربية", icon: "🇸🇦" },
  ],
  defaultLocale: "ar",
};

export const getDirection = (locale: string) => {
  return locale === "ar" ? "rtl" : "ltr";
};
export type I18nConfig = typeof i18n;
export type Locale = I18nConfig["locales"][number];
