"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cardVariants } from "@/components/ui/card";

type Spec = { k: string; v: string };

function SpecList({ specs }: { specs: Spec[] }) {
  return (
    <dl className={cardVariants({ flush: true, className: "flex flex-col" })}>
      {specs.map((s, i) => (
        <div
          key={s.k}
          className={`flex gap-4 px-5 py-3.5 text-[15px] ${i < specs.length - 1 ? "border-b border-border" : ""}`}
        >
          <dt className="w-40 shrink-0 text-foreground-secondary">{s.k}</dt>
          <dd className="font-semibold">{s.v}</dd>
        </div>
      ))}
    </dl>
  );
}

// Desktop: underline tabs. Phones: stacked disclosure cards.
export default function ProductDetails({
  description,
  specs,
  reviews,
  reviewCount,
}: {
  description: string;
  specs: Spec[];
  reviews: React.ReactNode;
  reviewCount: number;
}) {
  const t = useTranslations("Product");
  const about = (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-[22px] font-extrabold tracking-[-0.02em] md:text-[26px]">{t("About this item")}</h2>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/80 md:text-[17px] md:leading-[1.65]">
        {description}
      </p>
    </div>
  );

  return (
    <>
      <Tabs defaultValue="description" className="hidden md:block">
        <TabsList className="gap-8">
          <TabsTrigger value="description" className="h-12 text-base">{t("Description")}</TabsTrigger>
          <TabsTrigger value="specs" className="h-12 text-base">{t("Specifications")}</TabsTrigger>
          <TabsTrigger value="reviews" className="h-12 text-base">
            {t("Reviews")}
            {reviewCount > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-xs">{reviewCount}</span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-6">
          <div className="grid grid-cols-2 gap-12">
            {about}
            <SpecList specs={specs} />
          </div>
        </TabsContent>
        <TabsContent value="specs" className="mt-6 max-w-2xl">
          <SpecList specs={specs} />
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          {reviews}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 md:hidden">
        {[
          { key: "d", title: t("Description"), body: <p className="text-[15px] leading-relaxed text-foreground/80">{description}</p>, open: true },
          { key: "s", title: t("Specifications"), body: <SpecList specs={specs} /> },
          { key: "r", title: t("Customer Reviews"), body: reviews },
        ].map((s) => (
          <details
            key={s.key}
            open={s.open}
            className={cardVariants({ size: "sm", className: "group [&_summary::-webkit-details-marker]:hidden" })}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold">
              {s.title}
              <ChevronDown className="size-4 transition-transform duration-base group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-2.5">{s.body}</div>
          </details>
        ))}
      </div>
    </>
  );
}
