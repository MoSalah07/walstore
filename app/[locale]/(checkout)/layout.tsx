import { ArrowLeft, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import Container from "@/components/shared/container";
import Logo from "@/components/shared/logo";
import { Link } from "@/i18n/routing";

// Distraction-free checkout: logo, "Secure checkout", back to cart.
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Checkout");
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-card">
        <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Logo size="sm" className="md:hidden" />
          <Logo className="hidden md:flex" />
          <span className="hidden items-center gap-2 text-[15px] font-bold sm:flex">
            <Lock className="size-[18px] text-success" aria-hidden />
            {t("Secure checkout")}
          </span>
          <Link href="/cart" className="flex items-center gap-1.5 text-sm font-semibold md:text-[15px]">
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t("Back to cart")}
          </Link>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
