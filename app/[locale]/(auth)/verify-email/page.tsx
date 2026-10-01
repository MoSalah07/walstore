import { CircleCheck, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import ResendVerificationButton from "@/components/shared/auth/resend-verification-button";
import AuthShell from "@/components/shared/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { WEBSITE_NAME } from "@/constants";
import { Link } from "@/i18n/routing";
import connectToDatabase from "@/lib/connect.db";
import { verifyEmailToken } from "@/lib/email-verification";
import User from "@/models/user.model";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: `${t("Verify title")} · ${WEBSITE_NAME}`, robots: { index: false } };
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token = "" }, t, session] = await Promise.all([searchParams, getTranslations("Auth"), auth()]);
  let result = token ? await verifyEmailToken(token) : "expired";
  // A link opened twice (or by a mail scanner first) is already used up.
  if (result === "expired" && session?.user?.id) {
    await connectToDatabase();
    const me = await User.findById(session.user.id).select("emailVerified").lean();
    if (me?.emailVerified) result = "verified";
  }

  return (
    <AuthShell title={t("Welcome back")} body={t("Sign in body")}>
      {result === "verified" ? (
        <div className="flex flex-col gap-5" role="status">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
            <CircleCheck className="size-7" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[40px]">{t("Email verified title")}</h1>
            <p className="text-[15px] leading-relaxed text-foreground-secondary">{t("Email verified body")}</p>
          </div>
          <Link href={session ? "/account" : "/sign-in"} className={buttonVariants({ size: "xl" })}>
            {session ? t("Go to account") : t("Sign in")}
          </Link>
          <Link href="/" className="self-start text-[15px] font-semibold underline-offset-4 hover:underline">{t("Continue shopping")}</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-warning-bg text-warning-fg">
            <Clock className="size-7" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[40px]">{t("Link expired")}</h1>
            <p className="text-[15px] leading-relaxed text-foreground-secondary">
              {session ? t("Verify link expired body") : t("Verify link expired signed out")}
            </p>
          </div>
          {session ? (
            <ResendVerificationButton size="xl" />
          ) : (
            <Link href="/sign-in?callbackUrl=%2Faccount" className={buttonVariants({ size: "xl" })}>{t("Sign in")}</Link>
          )}
        </div>
      )}
    </AuthShell>
  );
}
