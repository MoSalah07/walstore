import { getTranslations } from "next-intl/server";

import AuthShell from "@/components/shared/auth/auth-shell";
import { WEBSITE_NAME } from "@/constants";
import FormForgotPassword from "./form-forgot-password";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: `${t("Forgot title")} · ${WEBSITE_NAME}` };
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const [{ email }, t] = await Promise.all([searchParams, getTranslations("Auth")]);
  return (
    <AuthShell title={t("Welcome back")} body={t("Sign in body")}>
      <FormForgotPassword defaultEmail={email ?? ""} />
    </AuthShell>
  );
}
