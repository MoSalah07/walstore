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
        <CheckCircle2 className="size-5 text-inverse-success" aria-hidden />
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
          className="h-11 min-w-0 flex-1 rounded-[10px] border-0 bg-inverse-foreground px-4 text-sm text-inverse outline-none placeholder:text-inverse/55 focus-visible:shadow-[0_0_0_4px_rgb(var(--inverse-accent)/0.35)]"
        />
        <Button type="submit" size="lg" variant="inverse" loading={pending}>
          {t("Subscribe")}
        </Button>
      </div>
      {state?.error && (
        <p id={`${id}-err`} role="alert" className="text-[13px] font-semibold text-inverse-error">
          {state.error === "invalid" ? t("Enter a valid email") : t("Try again later")}
        </p>
      )}
    </form>
  );
}
