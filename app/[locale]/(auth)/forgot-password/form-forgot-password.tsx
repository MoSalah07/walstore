"use client";

import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { requestPasswordReset } from "@/actions/auth-email.action";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

export default function FormForgotPassword({ defaultEmail }: { defaultEmail: string }) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState(defaultEmail);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await requestPasswordReset(email);
      if (res.ok) setSentTo(email.trim());
      else setError(t("Invalid email"));
    } catch {
      setError(t("Something went wrong"));
    }
    setPending(false);
  };

  const back = (
    <Link href="/sign-in" className="flex items-center gap-1.5 self-start text-[15px] font-semibold underline-offset-4 hover:underline">
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
      {t("Back to sign in")}
    </Link>
  );

  if (sentTo) {
    return (
      <div className="flex flex-col gap-5" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[40px]">{t("Check your email")}</h1>
          <p className="text-[15px] leading-relaxed text-foreground-secondary">
            {t.rich("Reset sent", { email: () => <span dir="ltr" className="font-semibold text-foreground">{sentTo}</span> })}
          </p>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground-secondary">{t("Reset spam hint")}</p>
        <Button variant="outline" size="lg" onClick={() => setSentTo(null)}>{t("Use another email")}</Button>
        {back}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[40px]">{t("Forgot title")}</h1>
        <p className="text-[15px] leading-relaxed text-foreground-secondary">{t("Forgot body")}</p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="fp-email">{t("Email")}</Label>
        <Input
          id="fp-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-[52px] text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          required
        />
      </div>
      <Button type="submit" size="xl" loading={pending} disabled={!email.trim()}>
        {t("Send reset link")}
      </Button>
      {back}
    </form>
  );
}
