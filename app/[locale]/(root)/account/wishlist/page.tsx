import { getTranslations } from "next-intl/server";

import { getMyAccount } from "@/actions/account.action";
import AccountNav from "@/components/shared/account/account-nav";
import Container from "@/components/shared/container";
import WishlistGrid from "./wishlist-grid";

export async function generateMetadata() {
  const t = await getTranslations("Account");
  return { title: t("Wishlist") };
}

export default async function WishlistPage() {
  const [t, account] = await Promise.all([getTranslations("Account"), getMyAccount()]);
  return (
    <Container className="flex flex-col gap-6 pb-16 pt-6 md:pb-20 md:pt-10 lg:flex-row lg:items-start lg:gap-8">
      <AccountNav name={account?.name ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="type-h1">{t("Wishlist")}</h1>
          <p className="text-[15px] text-foreground-secondary">{t("Wishlist help")}</p>
        </div>
        <WishlistGrid />
      </div>
    </Container>
  );
}
