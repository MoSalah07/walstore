import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import AuthShell from "@/components/shared/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { WEBSITE_NAME } from "@/constants";
import { Link } from "@/i18n/routing";
import connectToDatabase from "@/lib/connect.db";
import { findToken } from "@/lib/tokens";
import FormResetPassword from "./form-reset-password";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: `${t("Reset title")} · ${WEBSITE_NAME}`, robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token = "" }, t] = await Promise.all([searchParams, getTranslations("Auth")]);
  await connectToDatabase();
  const valid = await findToken(token, "reset-password");

  return (
    <AuthShell title={t("Welcome back")} body={t("Sign in body")}>
      {valid ? (
        <FormResetPassword token={token} email={valid.email} />
      ) : (
        <div className="flex flex-col gap-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-warning-bg text-warning-fg">
            <Clock className="size-7" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[40px]">{t("Link expired")}</h1>
            <p className="text-[15px] leading-relaxed text-foreground-secondary">{t("Reset link expired body")}</p>
          </div>
          <Link href="/forgot-password" className={buttonVariants({ size: "xl" })}>{t("Send new link")}</Link>
          <Link href="/sign-in" className="self-start text-[15px] font-semibold underline-offset-4 hover:underline">{t("Back to sign in")}</Link>
        </div>
      )}
    </AuthShell>
  );
}
