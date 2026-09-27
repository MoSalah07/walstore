"use client";

import { useState, useTransition } from "react";
import { Pencil, TriangleAlert, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { createUser, deleteUser, setUserActive, updateUser } from "@/actions/admin-user.action";
import { PasswordInput } from "@/components/shared/auth/password-input";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/routing";

function RolePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("AdminUsers");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{t("Role")}</legend>
      <RadioGroup value={value} onValueChange={onChange}>
        {(["user", "admin"] as const).map((r) => (
          <label key={r} className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3.5 has-[[data-state=checked]]:border-2 has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value={r} className="mt-0.5" />
            <span className="flex flex-col">
              <span className="text-sm font-bold">{t(`role.${r}`)}</span>
              <span className="text-[13px] text-foreground-secondary">{t(`role help.${r}`)}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

const errorKey = (e: string) =>
  ({ email: "Email taken", self: "Not yourself", "last-admin": "Last admin", invalid: "Invalid" } as Record<string, string>)[e] ?? "Failed";

export function EditUserDrawer({ user }: { user: { _id: string; name: string; email: string; role: string } }) {
  const t = useTranslations("AdminUsers");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: user.name, email: user.email, role: user.role });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) { setF({ name: user.name, email: user.email, role: user.role }); setError(null); } }}>
      <SheetTrigger asChild>
        <Button size="md">
          <Pencil aria-hidden />
          {t("Edit user")}
        </Button>
      </SheetTrigger>
      <SheetContent side="end" closeLabel={t("Close")} className="w-[420px] max-w-[92vw]">
        <SheetHeader>
          <SheetTitle>{t("Edit user")}</SheetTitle>
          <SheetDescription>{user.email}</SheetDescription>
        </SheetHeader>
        <form
          id="edit-user"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updateUser(user._id, f);
              if (r.ok) {
                toast.success(t("User saved"));
                setOpen(false);
                router.refresh();
              } else setError(t(errorKey(r.error)));
            });
          }}
        >
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eu-name">{t("Name")}</Label>
            <Input id="eu-name" size="sm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <span className="text-[13px] text-foreground-secondary">{t("Name help")}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eu-email">{t("Email")}</Label>
            <Input id="eu-email" size="sm" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <RolePicker value={f.role} onChange={(role) => setF({ ...f, role })} />
        </form>
        <SheetFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
          <Button type="submit" form="edit-user" loading={pending}>{t("Save changes")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function DeleteUserDialog({ user, orders }: { user: { _id: string; name: string }; orders: number }) {
  const t = useTranslations("AdminUsers");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const word = t("DELETE");
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setTyped(""); setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="destructive-outline" size="md">{t("Delete user")}</Button>
      </DialogTrigger>
      <DialogContent role="alertdialog" closeLabel={t("Close")}>
        <span className="flex size-11 items-center justify-center rounded-full bg-error-bg text-error-fg">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <DialogHeader>
          <DialogTitle>{t("Delete title", { name: user.name })}</DialogTitle>
          <DialogDescription>{t("Delete body", { count: orders })}</DialogDescription>
        </DialogHeader>
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="del-c">{t("Type to confirm", { word })}</Label>
          <Input id="del-c" size="sm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
          <Button
            variant="destructive"
            disabled={typed.trim() !== word}
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await deleteUser(user._id);
                if (r.ok) {
                  toast.success(t("User deleted"));
                  router.push("/admin/users");
                  router.refresh();
                } else setError(t(errorKey(r.error)));
              })
            }
          >
            {t("Delete user")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations("AdminUsers");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="md"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await setUserActive(id, !active);
          if (r.ok) toast.success(active ? t("Deactivated") : t("Reactivated"));
          else toast.error(t(errorKey(r.error)));
          router.refresh();
        })
      }
    >
      {active ? t("Deactivate") : t("Reactivate")}
    </Button>
  );
}

export function AddUserDialog() {
  const t = useTranslations("AdminUsers");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", role: "user", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null); if (o) setF({ name: "", email: "", role: "user", password: "" }); }}>
      <DialogTrigger asChild>
        <Button size="md">
          <UserPlus aria-hidden />
          {t("Add user")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("Close")} className="max-w-lg">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await createUser(f);
              if (r.ok) {
                toast.success(t("User created"));
                setOpen(false);
                router.push(`/admin/users/${r.id}`);
              } else setError(t(errorKey(r.error)));
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("Add user")}</DialogTitle>
            <DialogDescription>{t("Add user help")}</DialogDescription>
          </DialogHeader>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="au-name">{t("Name")}</Label>
              <Input id="au-name" size="sm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="au-email">{t("Email")}</Label>
              <Input id="au-email" size="sm" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="au-pw">{t("Temporary password")}</Label>
            <PasswordInput id="au-pw" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="h-[42px] text-sm" />
            <span className="text-[13px] text-foreground-secondary">{t("Password help")}</span>
          </div>
          <RolePicker value={f.role} onChange={(role) => setF({ ...f, role })} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
            <Button type="submit" loading={pending}>{t("Create user")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
