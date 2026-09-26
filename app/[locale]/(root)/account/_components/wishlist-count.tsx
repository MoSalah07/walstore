"use client";

import { useTranslations } from "next-intl";

import useMounted from "@/hooks/use-mounted";
import useWishlist from "@/store/use-wishlist";

export default function WishlistCount() {
  const t = useTranslations("Account");
  const mounted = useMounted();
  const count = useWishlist((s) => s.ids.length);
  return <>{t("saved count", { count: mounted ? count : 0 })}</>;
}
