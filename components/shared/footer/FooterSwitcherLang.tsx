"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { i18n } from "@/i18n/i18n-confige";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";

export default function FooterSwitcherLang() {
  const { locales } = i18n;
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const t = useTranslations("Footer");
  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        router.push(pathname, { locale: value });
      }}
    >
      <SelectTrigger className="text-white w-1/2 sm:w-fit">
        <SelectValue placeholder={t("Select a language")} />
      </SelectTrigger>
      <SelectContent>
        {locales.map((lang, index) => (
          <SelectItem key={index} value={lang.code}>
            <Link
              className=" flex items-center gap-1 w-fit"
              href={pathname}
              locale={lang.code}
            >
              <span className="text-lg">{lang.icon}</span> {lang.name}
            </Link>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
