import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SwitchAccount } from "@/actions/user.action";
import Logo from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("NotAllowed");
  return { title: t("Title"), robots: { index: false } };
}

// 403: automated requests and accounts without permission (e.g. /admin).
export default async function NotAllowedPage() {
  const t = await getTranslations("NotAllowed");
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="container flex h-20 items-center">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-20">
        <div className="flex max-w-[560px] flex-col items-center gap-5 text-center">
          <span className="flex size-[72px] items-center justify-center rounded-full bg-error-bg text-error-fg">
            <ShieldAlert className="size-8" aria-hidden />
          </span>
          <span className="type-overline text-sm text-error-fg">{t("Error 403")}</span>
          <h1 className="type-h1">{t("Title")}</h1>
          <p className="text-base leading-relaxed text-foreground-secondary md:text-lg">{t("Body")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              {t("Go home")}
            </Link>
            <form action={SwitchAccount}>
              <button type="submit" className={buttonVariants({ size: "lg", variant: "outline" })}>
                {t("Switch account")}
              </button>
            </form>
          </div>
          <Link href="/page/help" className="font-semibold underline-offset-4 hover:underline">
            {t("Contact")}
          </Link>
        </div>
      </main>
    </div>
  );
}
