import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import Container from "@/components/shared/container";
import { PAGE_SLUGS, PageSlug } from "@/constants";
import { PAGES } from "@/content/pages";
import { Link } from "@/i18n/routing";
import { formatMoney, ltr } from "@/lib/format";
import { getPricingConfig } from "@/lib/settings";
import { cn } from "@/lib/utils";
import HelpCenter from "./help-center";

type Props = { params: Promise<{ slug: string }> };

const isSlug = (s: string): s is PageSlug => (PAGE_SLUGS as readonly string[]).includes(s);

export async function generateMetadata({ params }: Props) {
  const [{ slug }, locale, t] = await Promise.all([params, getLocale(), getTranslations("Help")]);
  if (!isSlug(slug)) return {};
  if (slug === "help") return { title: t("Help title") };
  return { title: PAGES[slug][locale === "ar" ? "ar" : "en"].title };
}

// Placeholder copy the business must replace renders muted and italic.
function Paragraph({ text }: { text: string }) {
  const placeholder = /^\[.*\]$/.test(text.trim());
  return (
    <p className={cn("text-base leading-[1.7]", placeholder ? "italic text-muted-foreground" : "text-foreground/80")}>{text}</p>
  );
}

const POLICY_TABS: PageSlug[] = ["conditions-of-use", "privacy-policy", "help"];

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  if (slug === "help") return <HelpCenter />;

  const [locale, t, pricing] = await Promise.all([getLocale(), getTranslations("Help"), getPricingConfig()]);
  const page = PAGES[slug][locale === "ar" ? "ar" : "en"];
  const fill = (s: string) =>
    s
      .replace("{free}", ltr(formatMoney(pricing.freeShippingMin, "USD", locale, true)))
      .replace("{standard}", ltr(formatMoney(pricing.standard)))
      .replace("{express}", ltr(formatMoney(pricing.express)));

  return (
    <Container className="flex flex-col gap-8 pb-16 pt-6 md:pb-20 md:pt-10">
      {POLICY_TABS.includes(slug) && (
        <nav aria-label={t("Policies")} className="flex gap-6 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--border))] scrollbar-none">
          {POLICY_TABS.map((s) => (
            <Link
              key={s}
              href={`/page/${s}`}
              aria-current={s === slug ? "page" : undefined}
              className={cn(
                "flex h-12 shrink-0 items-center text-[15px]",
                s === slug
                  ? "font-bold shadow-[inset_0_-2px_0_rgb(var(--foreground))]"
                  : "font-semibold text-foreground-secondary hover:text-foreground"
              )}
            >
              {s === "help" ? t("Help") : PAGES[s as Exclude<PageSlug, "help">][locale === "ar" ? "ar" : "en"].title}
            </Link>
          ))}
        </nav>
      )}
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        {page.sections.length > 1 && (
          <nav aria-label={t("On this page")} className="hidden flex-col gap-1 self-start lg:sticky lg:top-44 lg:flex">
            <span className="type-overline mb-2 text-muted-foreground">{t("On this page")}</span>
            {page.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-sm px-3 py-2 text-sm font-medium text-foreground-secondary transition-colors duration-fast hover:bg-card hover:text-foreground"
              >
                {s.title}
              </a>
            ))}
          </nav>
        )}
        <article className={cn("flex max-w-[720px] flex-col gap-8", page.sections.length <= 1 && "lg:col-span-2")}>
          <header className="flex flex-col gap-3">
            <h1 className="type-h1">{page.title}</h1>
            {page.intro && <p className="text-lg text-foreground-secondary">{fill(page.intro)}</p>}
            {page.updated && (
              <span className="text-sm text-muted-foreground">{t("Last updated", { date: page.updated })}</span>
            )}
          </header>
          {page.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-44 flex-col gap-3">
              <h2 className="text-xl font-bold md:text-[22px]">
                {page.sections.length > 1 && `${i + 1}. `}
                {s.title}
              </h2>
              {s.body.map((b, j) => (
                <Paragraph key={j} text={fill(b)} />
              ))}
            </section>
          ))}
          <div className="flex flex-col gap-2 rounded-xl bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold">{t("Questions")}</span>
            <Link href="/page/help" className="font-bold underline underline-offset-4">
              {t("Contact Customer Service")}
            </Link>
          </div>
        </article>
      </div>
    </Container>
  );
}
