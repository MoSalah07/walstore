"use client";

import { useActionState, useId } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { subscribeToNewsletter } from "@/actions/newsletter.action";
import { Button } from "@/components/ui/button";

export default function NewsletterForm() {
  const t = useTranslations("Home");
  const id = useId();
  const [state, action, pending] = useActionState(subscribeToNewsletter, null);

  if (state?.ok) {
    return (
      <p role="status" className="flex items-center gap-2.5 text-base font-semibold text-inverse-foreground">
        <CheckCircle2 className="size-5 text-[#4ADE80]" aria-hidden />
        {t("Subscribed")}
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-2 lg:w-[520px]" noValidate>
      <label htmlFor={id} className="text-[13px] font-semibold text-inverse-muted">
        {t("Email address")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={state?.error === "invalid" || undefined}
          aria-describedby={state?.error ? `${id}-err` : undefined}
          className="h-[52px] min-w-0 flex-1 rounded-full border-0 bg-white px-[22px] text-[15px] text-[#0B0D12] outline-none placeholder:text-[#667085] focus-visible:shadow-[0_0_0_4px_rgb(255_255_255/0.25)]"
        />
        <Button type="submit" size="lg" variant="inverse" loading={pending} className="px-[26px]">
          {t("Subscribe")}
        </Button>
      </div>
      {state?.error && (
        <p id={`${id}-err`} role="alert" className="text-[13px] font-semibold text-[#F97066]">
          {state.error === "invalid" ? t("Enter a valid email") : t("Try again later")}
        </p>
      )}
    </form>
  );
}
