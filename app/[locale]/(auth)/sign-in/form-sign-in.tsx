"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { signInWithCredentials } from "@/actions/user.action";
import { PasswordInput } from "@/components/shared/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WEBSITE_NAME } from "@/constants";
import { Link } from "@/i18n/routing";
import { IUserSignIn } from "@/interfaces/user.type";
import { UserSignInSchema } from "@/interfaces/validator/validator";

const signInDefaultValues =
  process.env.NODE_ENV === "development"
    ? { email: "admin@example.com", password: "123456" }
    : { email: "", password: "" };

// Only same-site paths are allowed as a post-login destination.
const safeCallback = (url?: string) => (url && url.startsWith("/") && !url.startsWith("//") ? url : "/");

export default function FormSignIn({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("Auth");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  });

  const onSubmit = async (data: IUserSignIn) => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await signInWithCredentials(data);
      if (!res.ok) throw new Error("auth");
      // Full reload so the header and session pick up the new cookie.
      window.location.assign(safeCallback(callbackUrl));
    } catch {
      setFailed(true);
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[34px] font-extrabold tracking-[-0.035em] md:text-[40px]">{t("Sign in")}</h1>
          <p className="text-[15px] text-foreground-secondary">
            {t.rich("New to", {
              name: WEBSITE_NAME,
              link: (chunks) => (
                <Link
                  href={callbackUrl ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-up"}
                  className="font-bold text-foreground underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>

        {failed && <Alert variant="error">{t("Invalid credentials")}</Alert>}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("Email")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" className="h-[52px] text-base" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("Password")}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="xl" loading={loading}>
          {loading ? t("Signing in") : t("Sign in")}
        </Button>

        <p className="text-[13px] leading-relaxed text-foreground-secondary">
          {t.rich("Agree", {
            name: WEBSITE_NAME,
            terms: (c) => <Link href="/page/conditions-of-use" className="font-semibold text-foreground underline-offset-4 hover:underline">{c}</Link>,
            privacy: (c) => <Link href="/page/privacy-policy" className="font-semibold text-foreground underline-offset-4 hover:underline">{c}</Link>,
          })}
        </p>
      </form>
    </Form>
  );
}
