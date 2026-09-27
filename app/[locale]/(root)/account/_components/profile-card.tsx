"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { changeMyPassword, updateMyName } from "@/actions/account.action";
import { PasswordInput, StrengthMeter } from "@/components/shared/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cardVariants } from "@/components/ui/card";

function PasswordDialog() {
  const t = useTranslations("Account");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await changeMyPassword({ current, next });
      if (res.ok) {
        toast.success(t("Password changed"));
        setOpen(false);
        setCurrent("");
        setNext("");
      } else setError(res.error === "wrong" ? t("Wrong password") : t("Weak password"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("Change password")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("Close")}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Change password")}</DialogTitle>
            <DialogDescription>{t("Password rule")}</DialogDescription>
          </DialogHeader>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-current">{t("Current password")}</Label>
            <PasswordInput id="pw-current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pw-next">{t("New password")}</Label>
            <PasswordInput id="pw-next" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            <StrengthMeter value={next} />
          </div>
          <DialogFooter>
            <Button type="submit" loading={pending}>
              {t("Save password")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfileCard({ name, email }: { name: string; email: string }) {
  const t = useTranslations("Account");
  const [value, setValue] = useState(name);
  const [pending, start] = useTransition();
  const dirty = value.trim() !== name;

  return (
    <section className={cardVariants({ size: "lg", className: "flex flex-col gap-[18px]" })}>
      <h2 className="text-xl font-bold">{t("Profile")}</h2>
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updateMyName(value);
            if (res.ok) toast.success(t("Name saved"));
            else toast.error(t("Name invalid"));
          });
        }}
      >
        <Label htmlFor="ac-name">{t("Name")}</Label>
        <div className="flex gap-2">
          <Input id="ac-name" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="name" className="h-12" />
          {dirty && (
            <Button type="submit" loading={pending} className="shrink-0">
              {t("Save")}
            </Button>
          )}
        </div>
      </form>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ac-email">{t("Email")}</Label>
        <Input id="ac-email" value={email} readOnly className="h-12 bg-sunken text-foreground-secondary" />
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border-soft pt-4">
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold">{t("Password")}</span>
          <span className="text-[13px] text-foreground-secondary">{t("Password help")}</span>
        </span>
        <PasswordDialog />
      </div>
    </section>
  );
}
