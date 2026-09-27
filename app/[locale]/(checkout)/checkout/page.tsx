import { getTranslations } from "next-intl/server";

import { getMyAccount } from "@/actions/account.action";
import Container from "@/components/shared/container";
import { requireUser } from "@/lib/auth-guard";
import { getPricingConfig } from "@/lib/settings";
import CheckoutForm from "./checkout-form";

export async function generateMetadata() {
  const t = await getTranslations("Checkout");
  return { title: t("Checkout") };
}

export default async function CheckoutPage() {
  await requireUser("/checkout");
  const [t, account, pricing] = await Promise.all([
    getTranslations("Checkout"),
    getMyAccount(),
    getPricingConfig(),
  ]);

  const steps = [
    { label: t("Cart"), state: "done" as const },
    { label: t("Shipping & payment"), state: "current" as const },
    { label: t("Confirmation"), state: "todo" as const },
  ];

  return (
    <Container className="flex flex-col gap-6 pb-32 pt-6 md:gap-8 md:pb-20 md:pt-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="type-h1">{t("Checkout")}</h1>
        <ol className="flex items-center gap-2 text-sm" aria-label={t("Progress")}>
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="h-px w-6 bg-input md:w-10" />}
              <span
                aria-current={s.state === "current" ? "step" : undefined}
                className={`flex items-center gap-2 ${s.state === "todo" ? "text-foreground-secondary" : "font-bold"}`}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    s.state === "done"
                      ? "bg-success text-success-foreground"
                      : s.state === "current"
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-input"
                  }`}
                >
                  {s.state === "done" ? "✓" : i + 1}
                </span>
                <span className={s.state === "current" ? "" : "hidden sm:inline"}>{s.label}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <CheckoutForm
        pricing={pricing}
        addresses={account?.addresses ?? []}
        defaultName={account?.name ?? ""}
      />
    </Container>
  );
}
