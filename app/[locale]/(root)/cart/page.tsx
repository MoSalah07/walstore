import { getTranslations } from "next-intl/server";

import Container from "@/components/shared/container";
import { getPricingConfig } from "@/lib/settings";
import CartView from "./cart-view";

export async function generateMetadata() {
  const t = await getTranslations("Cart");
  return { title: t("Shopping Cart") };
}

export default async function CartPage() {
  const [t, pricing] = await Promise.all([getTranslations("Cart"), getPricingConfig()]);
  return (
    <Container className="flex flex-col pb-16 pt-6 md:pb-20 md:pt-10">
      <h1 className="type-h1">{t("Shopping Cart")}</h1>
      <CartView pricing={pricing} />
    </Container>
  );
}
