"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { resendVerificationEmail } from "@/actions/auth-email.action";
import { Button, ButtonProps } from "@/components/ui/button";

export default function ResendVerificationButton(props: ButtonProps) {
  const t = useTranslations("Auth");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Button
      {...props}
      loading={pending}
      disabled={sent || props.disabled}
      onClick={() =>
        start(async () => {
          const res = await resendVerificationEmail();
          if (res.ok) {
            setSent(true);
            toast.success(t("Verification sent"));
          } else if (res.error === "wait") toast.error(t("Wait a minute"));
          else if (res.error === "verified") toast.success(t("Already verified"));
          else toast.error(t("Something went wrong"));
        })
      }
    >
      {sent ? t("Verification sent short") : t("Resend verification")}
    </Button>
  );
}
