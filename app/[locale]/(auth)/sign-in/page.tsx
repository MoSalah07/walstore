import { getTranslations } from "next-intl/server";

import AuthShell from "@/components/shared/auth/auth-shell";
import { WEBSITE_NAME } from "@/constants";
import FormSignIn from "./form-sign-in";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: `${t("Sign in")} · ${WEBSITE_NAME}`, description: t("Sign in body") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string; email?: string }>;
}) {
  const [{ callbackUrl, reset, email }, t] = await Promise.all([searchParams, getTranslations("Auth")]);
  return (
    <AuthShell title={t("Welcome back")} body={t("Sign in body")}>
      <FormSignIn callbackUrl={callbackUrl} passwordReset={reset === "1"} email={email} />
    </AuthShell>
  );
}
