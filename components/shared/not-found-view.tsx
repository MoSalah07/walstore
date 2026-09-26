import Image from "next/image";
import { getTranslations } from "next-intl/server";

import SearchBar from "@/components/shared/header/search-bar";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

// "This page wandered off." — search, home and deals, with a lone sneaker.
export default async function NotFoundView() {
  const t = await getTranslations("NotFound");
  return (
    <div className="container flex flex-1 flex-col-reverse items-center justify-center gap-10 py-12 md:py-20 lg:flex-row lg:justify-between lg:gap-16">
      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <span className="type-overline text-sm text-deal">{t("Error 404")}</span>
        <h1 className="type-display">{t("Title")}</h1>
        <p className="text-base leading-relaxed text-foreground-secondary md:text-lg">{t("Body")}</p>
        <SearchBar compact className="h-14" />
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            {t("Back to home")}
          </Link>
          <Link href="/search?tag=todays-deal" className={buttonVariants({ size: "lg", variant: "outline" })}>
            {t("Today's Deals")}
          </Link>
        </div>
      </div>
      <div className="relative flex w-full max-w-[520px] items-center justify-center">
        <span aria-hidden className="select-none font-display text-[140px] font-extrabold leading-none tracking-[-0.06em] text-border md:text-[240px]">
          404
        </span>
        <div className="absolute flex size-44 items-center justify-center rounded-full bg-card shadow-md motion-safe:animate-[fade-up_600ms_ease-out_both] md:size-64">
          <span className="relative size-[70%]">
            <Image src="/images/p41-1.jpg" alt={t("Image alt")} fill sizes="260px" className="object-contain mix-blend-multiply" />
          </span>
        </div>
      </div>
    </div>
  );
}
