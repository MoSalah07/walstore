import { getLocale, getTranslations } from "next-intl/server";

import Container from "@/components/shared/container";
import { SUPPORT } from "@/content/pages";
import { formatMoney, ltr } from "@/lib/format";
import { getPricingConfig } from "@/lib/settings";
import HelpSearch from "./help-search";

export default async function HelpCenter() {
  const [t, locale, pricing] = await Promise.all([getTranslations("Help"), getLocale(), getPricingConfig()]);
  const free = ltr(formatMoney(pricing.freeShippingMin, "USD", locale, true));

  const topics = [
    { title: t("topic.orders"), sub: t("topic.orders sub"), href: "/account/orders" },
    { title: t("topic.shipping"), sub: t("topic.shipping sub", { free }), href: "/page/shipping" },
    { title: t("topic.returns"), sub: t("topic.returns sub"), href: "/page/returns" },
    { title: t("topic.payments"), sub: t("topic.payments sub"), href: "/page/shipping#payment" },
    { title: t("topic.account"), sub: t("topic.account sub"), href: "/account" },
    { title: t("topic.about"), sub: t("topic.about sub"), href: "/page/about-us" },
  ];
  const faqs = [
    { q: t("faq.shipping q"), a: t("faq.shipping a", { free }) },
    { q: t("faq.where q"), a: t("faq.where a") },
    { q: t("faq.cancel q"), a: t("faq.cancel a") },
    { q: t("faq.returns q"), a: t("faq.returns a") },
    { q: t("faq.pay q"), a: t("faq.pay a") },
    { q: t("faq.currency q"), a: t("faq.currency a") },
    { q: t("faq.arabic q"), a: t("faq.arabic a") },
  ];

  return (
    <Container className="flex flex-col gap-12 pb-16 pt-6 md:gap-[72px] md:pb-20 md:pt-10">
      <HelpSearch
        topics={topics}
        faqs={faqs}
        support={SUPPORT}
        labels={{
          eyebrow: t("Customer Service"),
          title: t("How can we help"),
          search: t("Search help"),
          placeholder: t("Search placeholder"),
          searchButton: t("Search"),
          topics: t("Browse topics"),
          faq: t("FAQ"),
          faqSub: t("FAQ sub"),
          noMatch: t("No match"),
          stillTitle: t("Still need help"),
          stillBody: t("Still body", { email: SUPPORT.email, phone: SUPPORT.phone }),
          email: t("Email us"),
          orders: t("Your orders"),
        }}
      />
    </Container>
  );
}
