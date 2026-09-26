import { getTranslations } from "next-intl/server";

import { getSettingsForAdmin } from "@/actions/admin-system.action";
import { CURRENCY } from "@/constants/currency";
import { i18n } from "@/i18n/i18n-confige";
import SettingsForm from "./settings-form";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.settings") };
}

export default async function AdminSettingsPage() {
  const [t, s] = await Promise.all([getTranslations("AdminSettings"), getSettingsForAdmin()]);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Settings")}</h1>
      <SettingsForm
        initial={{
          storeName: s.storeName,
          supportEmail: s.supportEmail,
          supportPhone: s.supportPhone,
          freeShippingMin: s.pricing.freeShippingMin.toFixed(2),
          standardShipping: s.pricing.standard.toFixed(2),
          expressShipping: s.pricing.express.toFixed(2),
          taxPercent: String(Math.round(s.pricing.taxRate * 10000) / 100),
        }}
        languages={[...i18n.locales].sort((a) => (a.code === "en" ? -1 : 1)).map((l) => ({ code: l.code, name: l.name }))}
        currencies={CURRENCY}
      />
    </div>
  );
}
