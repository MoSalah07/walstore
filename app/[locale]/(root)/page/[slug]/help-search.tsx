"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Headset, Mail, Minus, Plus, SearchIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Labels = Record<
  | "eyebrow" | "title" | "search" | "placeholder" | "searchButton" | "topics" | "faq" | "faqSub"
  | "noMatch" | "stillTitle" | "stillBody" | "email" | "orders",
  string
>;

// Help hero with live search over topics and FAQs, then an accordion.
export default function HelpSearch({
  topics,
  faqs,
  support,
  labels,
}: {
  topics: { title: string; sub: string; href: string }[];
  faqs: { q: string; a: string }[];
  support: { email: string; phone: string };
  labels: Labels;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number>(0);
  const needle = q.trim().toLowerCase();
  const match = (s: string) => !needle || s.toLowerCase().includes(needle);
  const shownTopics = useMemo(() => topics.filter((t) => match(t.title) || match(t.sub)), [topics, needle]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownFaqs = useMemo(() => faqs.filter((f) => match(f.q) || match(f.a)), [faqs, needle]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasEmail = !/^\[.*\]$/.test(support.email);

  return (
    <>
      <section className="flex flex-col items-center gap-5 rounded-3xl bg-inverse px-6 py-12 text-center text-inverse-foreground md:py-16">
        <span className="type-overline text-[13px] text-inverse-muted">{labels.eyebrow}</span>
        <h1 className="type-display">{labels.title}</h1>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById("help-results")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-2 flex h-12 w-full max-w-[640px] items-center gap-2 rounded-md bg-inverse-foreground pe-1.5 ps-4 text-inverse"
        >
          <label htmlFor="h-q" className="sr-only">
            {labels.search}
          </label>
          <SearchIcon className="size-5 shrink-0 text-inverse/60" aria-hidden />
          <input
            id="h-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.placeholder}
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-inverse/55"
          />
          <button type="submit" className={buttonVariants({ size: "md", className: "bg-inverse text-inverse-foreground hover:bg-inverse/90" })}>
            {labels.searchButton}
          </button>
        </form>
      </section>

      <section id="help-results" className="flex scroll-mt-44 flex-col gap-6">
        <h2 className="type-h2">{labels.topics}</h2>
        {shownTopics.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {shownTopics.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className={cardVariants({ variant: "interactive", size: "lg", className: "group flex flex-col gap-2" })}
              >
                <span className="flex items-center justify-between text-lg font-bold">
                  {t.title}
                  <ArrowRight className="size-[18px] transition-transform duration-fast group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
                </span>
                <span className="text-[15px] text-foreground-secondary">{t.sub}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-foreground-secondary">{labels.noMatch}</p>
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-3">
          <h2 className="type-h2">{labels.faq}</h2>
          <p className="text-base text-foreground-secondary">{labels.faqSub}</p>
        </div>
        <div className={cardVariants({ flush: true, className: "flex flex-col" })}>
          {shownFaqs.length === 0 && <p className="p-6 text-foreground-secondary">{labels.noMatch}</p>}
          {shownFaqs.map((f, i) => {
            const isOpen = open === i || !!needle;
            return (
              <div key={f.q} className={cn(i < shownFaqs.length - 1 && "border-b border-border")}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(open === i ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start text-base font-bold"
                  >
                    {f.q}
                    {isOpen ? <Minus className="size-4 shrink-0" aria-hidden /> : <Plus className="size-4 shrink-0" aria-hidden />}
                  </button>
                </h3>
                {isOpen && (
                  <p className={cn("px-6 pb-5 text-[15px] leading-relaxed", /^\[.*\]$/.test(f.a) ? "italic text-muted-foreground" : "text-foreground/80")}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={cardVariants({ size: "xl", className: "flex flex-col gap-6 md:flex-row md:items-center md:justify-between" })}>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Headset className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">{labels.stillTitle}</h2>
            <p className="text-[15px] text-foreground-secondary">{labels.stillBody}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {hasEmail && (
            <a href={`mailto:${support.email}`} className={buttonVariants({ size: "lg" })}>
              <Mail aria-hidden />
              {labels.email}
            </a>
          )}
          <Link href="/account/orders" className={buttonVariants({ size: "lg", variant: "outline" })}>
            {labels.orders}
          </Link>
        </div>
      </section>
    </>
  );
}
