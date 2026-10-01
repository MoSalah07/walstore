import { Heart, Headset, MapPin, Package } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getMyAccount } from "@/actions/account.action";
import { getMyOrderStats } from "@/actions/order.action";
import { SignOut } from "@/actions/user.action";
import Container from "@/components/shared/container";
import ResendVerificationButton from "@/components/shared/auth/resend-verification-button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import AddressBook from "./_components/address-book";
import Preferences from "./_components/preferences";
import ProfileCard from "./_components/profile-card";
import WishlistCount from "./_components/wishlist-count";

export async function generateMetadata() {
  const t = await getTranslations("Account");
  return { title: t("Your account") };
}

export default async function AccountPage() {
  const [t, locale, account, stats] = await Promise.all([
    getTranslations("Account"),
    getLocale(),
    getMyAccount(),
    getMyOrderStats(),
  ]);
  if (!account) return null;

  const tiles = [
    { href: "/account/orders", icon: Package, title: t("Your orders"), sub: t("orders summary", { total: stats.total, open: stats.open }) },
    { href: "/account/wishlist", icon: Heart, title: t("Wishlist"), sub: <WishlistCount /> },
    { href: "#addresses", icon: MapPin, title: t("Addresses"), sub: t("addresses count", { count: account.addresses.length }) },
    { href: "/page/help", icon: Headset, title: t("Help"), sub: t("Help sub") },
  ];

  return (
    <Container className="flex flex-col gap-7 pb-16 pt-6 md:pb-20 md:pt-10">
      <div className="flex items-center gap-4 md:gap-5">
        <Avatar name={account.name} size="lg" className="size-14 text-xl md:size-[72px] md:text-[26px]" />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-h1 text-[28px] leading-8 md:text-[40px] md:leading-10">{t("Your account")}</h1>
          <span className="truncate text-sm text-foreground-secondary md:text-[15px]">
            {account.name} · {account.email} · {t("member since", { date: formatDate(account.createdAt, locale, { month: "long", year: "numeric" }) })}
          </span>
        </div>
      </div>

      {!account.emailVerified && (
        <Alert
          variant="warning"
          title={t("Verify email title")}
          action={<ResendVerificationButton size="sm" variant="outline" className="bg-card" />}
        >
          {t.rich("Verify email body", { email: () => <span dir="ltr" className="break-all font-semibold">{account.email}</span> })}
        </Alert>
      )}

      <section aria-label={t("Shortcuts")} className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {tiles.map(({ href, icon: Icon, title, sub }) => (
          <Link
            key={title}
            href={href}
            className={cardVariants({ variant: "interactive", className: "flex min-h-[132px] flex-col gap-2.5 md:min-h-[150px]" })}
          >
            <span className="flex size-11 items-center justify-center rounded-md bg-secondary">
              <Icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="text-base font-bold md:text-[17px]">{title}</span>
            <span className="text-[13px] text-foreground-secondary md:text-sm">{sub}</span>
          </Link>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ProfileCard name={account.name} email={account.email} />
        <div className="flex flex-col gap-6">
          <AddressBook addresses={account.addresses} />
          <Preferences />
        </div>
      </div>

      <form action={SignOut}>
        <button type="submit" className="font-bold text-destructive underline-offset-4 hover:underline">
          {t("Sign out")}
        </button>
      </form>
    </Container>
  );
}
