"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { resetPassword } from "@/actions/auth-email.action";
import { PasswordInput, StrengthMeter } from "@/components/shared/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/routing";

// Same rule as sign-up (PasswordSchema): 8+ characters, a letter and a number.
const strongEnough = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export default function FormResetPassword({ token, email }: { token: string; email: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<React.ReactNode>(null);

  const weak = touched && !strongEnough(password);
  const mismatch = touched && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!strongEnough(password) || confirm !== password) return;
    setPending(true);
    setError(null);
    try {
      const res = await resetPassword({ token, password, confirmPassword: confirm });
      if (res.ok) {
        router.replace(`/sign-in?reset=1&email=${encodeURIComponent(email)}`);
        return;
      }
      setError(
        res.error === "expired"
          ? t.rich("Reset failed expired", { link: (c) => <Link href="/forgot-password" className="font-bold underline">{c}</Link> })
          : t("Password rule")
      );
    } catch {
      setError(t("Something went wrong"));
    }
    setPending(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[40px]">{t("Reset title")}</h1>
        <p className="text-[15px] leading-relaxed text-foreground-secondary">
          {t.rich("Reset body", { email: () => <span dir="ltr" className="font-semibold text-foreground">{email}</span> })}
        </p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-new">{t("New password")}</Label>
        <PasswordInput id="rp-new" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={weak} aria-describedby="rp-rule" autoFocus />
        <StrengthMeter value={password} />
        <p id="rp-rule" className={weak ? "text-[13px] font-semibold text-destructive" : "text-[13px] text-foreground-secondary"}>{t("Password rule")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-confirm">{t("Confirm password")}</Label>
        <PasswordInput id="rp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} aria-describedby={mismatch ? "rp-mismatch" : undefined} />
        {mismatch && <p id="rp-mismatch" className="text-[13px] font-semibold text-destructive">{t("Passwords differ")}</p>}
      </div>
      <Button type="submit" size="xl" loading={pending}>
        {t("Save new password")}
      </Button>
    </form>
  );
}
