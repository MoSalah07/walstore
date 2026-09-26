import { getTranslations } from "next-intl/server";

import AuthShell from "@/components/shared/auth/auth-shell";
import { WEBSITE_NAME } from "@/constants";
import FormSignUp from "./form-sign-up";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: `${t("Create account")} · ${WEBSITE_NAME}` };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ callbackUrl }, t] = await Promise.all([searchParams, getTranslations("Auth")]);
  return (
    <AuthShell
      title={t("Your account your way")}
      perks={[t("Perk orders"), t("Perk wishlist"), t("Perk checkout")]}
    >
      <FormSignUp callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
