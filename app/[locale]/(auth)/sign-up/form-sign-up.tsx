"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { registerUser, signInWithCredentials } from "@/actions/user.action";
import { PasswordInput, StrengthMeter } from "@/components/shared/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WEBSITE_NAME } from "@/constants";
import { Link } from "@/i18n/routing";
import { IUserSignUp } from "@/interfaces/user.type";
import { UserSignUpSchema } from "@/interfaces/validator/validator";

const signUpDefaultValues =
  process.env.NODE_ENV === "development"
    ? { name: "john doe", email: "john@me.com", password: "Password123", confirmPassword: "Password123" }
    : { name: "", email: "", password: "", confirmPassword: "" };

const safeCallback = (url?: string) => (url && url.startsWith("/") && !url.startsWith("//") ? url : "/");

export default function FormSignUp({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("Auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  });
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = async (data: IUserSignUp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser(data);
      if (!res.success) {
        setError(res.error === "User already exists" ? t("Email taken") : t("Something went wrong"));
        setLoading(false);
        return;
      }
      await signInWithCredentials({ email: data.email, password: data.password });
      window.location.assign(safeCallback(callbackUrl));
    } catch {
      setError(t("Something went wrong"));
      setLoading(false);
    }
  };

  const field = "h-[52px] text-base";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[34px] font-extrabold tracking-[-0.035em] md:text-[40px]">{t("Create account")}</h1>
          <p className="text-[15px] text-foreground-secondary">
            {t.rich("Have account", {
              link: (chunks) => (
                <Link
                  href={callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in"}
                  className="font-bold text-foreground underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <FormField
          control={form.control}
          name="name"
          render={({ field: f }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("Name")}</FormLabel>
              <FormControl>
                <Input autoComplete="name" className={field} {...f} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field: f }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("Email")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" className={field} {...f} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field: f }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("Password")}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...f} />
              </FormControl>
              <StrengthMeter value={password ?? ""} />
              <FormDescription>{t("Password rule")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field: f }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("Confirm password")}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...f} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="xl" loading={loading}>
          {loading ? t("Creating account") : t("Create account")}
        </Button>

        <p className="text-[13px] leading-relaxed text-foreground-secondary">
          {t.rich("Agree create", {
            name: WEBSITE_NAME,
            terms: (c) => <Link href="/page/conditions-of-use" className="font-semibold text-foreground underline-offset-4 hover:underline">{c}</Link>,
            privacy: (c) => <Link href="/page/privacy-policy" className="font-semibold text-foreground underline-offset-4 hover:underline">{c}</Link>,
          })}
        </p>
      </form>
    </Form>
  );
}
