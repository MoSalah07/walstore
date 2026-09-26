import { Check, History, Lock, Minus, ShieldCheck, ShoppingBag, UserPlus, UserRound, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getRoleMembers } from "@/actions/admin-system.action";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { formatNumber } from "@/lib/format";
import { PERMISSION_GROUPS, Scope, permissionCoverage } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.roles") };
}

const groupIcon = { storefront: ShoppingBag, store: ShieldCheck, system: Users };

function ScopeChip({ scope, label }: { scope: Scope; label: string }) {
  const Icon = scope === "all" ? Check : scope === "own" ? UserRound : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        scope === "all" ? "bg-success-bg text-success-fg" : scope === "own" ? "bg-secondary text-primary-hover dark:text-foreground" : "bg-background text-muted-foreground"
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export default async function AdminRolesPage({ searchParams }: { searchParams: Promise<{ role?: string; view?: string }> }) {
  const sp = await searchParams;
  const role = sp.role === "user" ? "user" : "admin";
  const view = sp.view === "matrix" ? "matrix" : "detail";
  const [t, members] = await Promise.all([getTranslations("AdminRoles"), getRoleMembers()]);
  const roles = [
    { key: "admin" as const, icon: ShieldCheck, count: members.admins, names: members.adminNames, isDefault: false },
    { key: "user" as const, icon: UserRound, count: members.customers, names: [] as string[], isDefault: true },
  ];
  const cur = roles.find((r) => r.key === role)!;
  const cov = permissionCoverage(role);
  const href = (patch: { role?: string; view?: string }) => {
    const q = new URLSearchParams({ role, view, ...patch });
    return `/admin/roles?${q}`;
  };
  const card = "rounded-[14px] border border-border bg-card";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Title")}</h1>
          <p className="text-[15px] text-foreground-secondary">{t("Sub")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/activity?entity=user" className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "h-[38px] rounded-[10px]")}>
            <History aria-hidden />
            {t("Role history")}
          </Link>
          <Link href="/admin/users?role=user" className={cn(buttonVariants({ size: "sm" }), "h-[38px] rounded-[10px]")}>
            <UserPlus aria-hidden />
            {t("Add an admin")}
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside aria-label={t("Roles")} className="flex flex-col gap-3">
          <span className="type-overline px-1 text-muted-foreground">{t("System roles", { count: roles.length })}</span>
          {roles.map((r) => {
            const c = permissionCoverage(r.key);
            const on = r.key === role;
            return (
              <Link
                key={r.key}
                href={href({ role: r.key })}
                aria-current={on ? "true" : undefined}
                className={cn(card, "flex flex-col gap-3.5 p-4 transition-colors duration-fast", on ? "border-2 border-primary" : "hover:border-foreground")}
              >
                <span className="flex items-center gap-3">
                  <span className={cn("flex size-10 items-center justify-center rounded-[10px]", r.key === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                    <r.icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-bold">{t(`role.${r.key}.name`)}</span>
                    <code className="text-xs text-muted-foreground" dir="ltr">role: &quot;{r.key}&quot;</code>
                  </span>
                  {r.isDefault && <Badge size="sm">{t("Default")}</Badge>}
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="flex justify-between text-xs"><span className="text-foreground-secondary">{t("Access")}</span><span className="font-bold tabular-nums">{c.granted}/{c.total}</span></span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", r.key === "admin" ? "bg-foreground" : "bg-success")} style={{ width: `${(c.granted / c.total) * 100}%` }} /></span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex -space-x-2 rtl:space-x-reverse">
                    {r.names.slice(0, 3).map((n) => <Avatar key={n} name={n} size="sm" tone="soft" className="ring-2 ring-card" />)}
                  </span>
                  <span className="text-[13px] text-foreground-secondary">{t(`members.${r.key}`, { count: r.count, n: formatNumber(r.count) })}</span>
                </span>
              </Link>
            );
          })}
          <div className={cn(card, "flex flex-col gap-2 border-dashed p-4 text-[13px] text-foreground-secondary")}>
            <span className="flex items-center gap-2 font-bold text-foreground"><Lock className="size-4" aria-hidden />{t("Custom roles")}</span>
            <span>{t("Custom roles body")}</span>
            <button type="button" disabled aria-disabled className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "mt-1 self-start")}>{t("New role later")}</button>
          </div>
        </aside>

        <section aria-label={t("Role details")} className={cn(card, "flex flex-col gap-5 p-5 md:p-6")}>
          <div className="flex flex-wrap items-start gap-4">
            <span className={cn("flex size-12 items-center justify-center rounded-md", role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <cur.icon className="size-6" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{t(`role.${role}.name`)}</h2>
                <Badge variant="muted" size="sm"><Lock className="size-3" aria-hidden />{t("System role")}</Badge>
              </div>
              <p className="text-sm text-foreground-secondary">{t(`role.${role}.desc`)}</p>
            </div>
            <nav aria-label={t("View")} className="inline-flex h-[38px] gap-0.5 rounded-[10px] bg-muted p-[3px]">
              {(["detail", "matrix"] as const).map((v) => (
                <Link key={v} href={href({ view: v })} aria-current={v === view ? "true" : undefined}
                  className={cn("flex h-8 items-center rounded-sm px-3 text-[13px] font-semibold", v === view ? "bg-card shadow-sm" : "text-foreground-secondary")}>
                  {t(`view.${v}`)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-background-subtle px-4 py-3 text-sm">
            <span>{t.rich("granted", { n: cov.granted, total: cov.total, b: (c) => <strong>{c}</strong> })}</span>
            <span className="flex gap-2">
              <ScopeChip scope="all" label={t("scope.all")} />
              <ScopeChip scope="own" label={t("scope.own")} />
              <ScopeChip scope="none" label={t("scope.none")} />
            </span>
          </div>

          {view === "detail" ? (
            PERMISSION_GROUPS.map((g) => {
              const Icon = groupIcon[g.key];
              return (
                <div key={g.key} className="flex flex-col">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><Icon className="size-4" aria-hidden />{t(`group.${g.key}`)}</h3>
                  <ul className="flex flex-col rounded-md border border-border">
                    {g.rows.map((r) => (
                      <li key={r.key} className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3 last:border-0">
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-semibold">{t(`perm.${r.key.replace(".", "_")}`)}</span>
                          <code className="text-xs text-muted-foreground" dir="ltr">{r.key}</code>
                        </span>
                        <ScopeChip scope={r[role]} label={t(`scope.${r[role]}`)} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background-subtle text-xs text-foreground-secondary">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">{t("Permission")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("role.user.name")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("role.admin.name")}</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.flatMap((g) => g.rows).map((r) => (
                    <tr key={r.key} className="border-t border-border-soft">
                      <td className="px-4 py-2.5 font-semibold">{t(`perm.${r.key.replace(".", "_")}`)}</td>
                      <td className="px-4 py-2.5"><ScopeChip scope={r.user} label={t(`scope.${r.user}`)} /></td>
                      <td className="px-4 py-2.5"><ScopeChip scope={r.admin} label={t(`scope.${r.admin}`)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
