import { Search, UsersRound } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAdminUsers } from "@/actions/admin-user.action";
import StatCard from "@/components/admin/stat-card";
import Pagination from "@/components/shared/pagination/pagination";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddUserDialog } from "./user-dialogs";

type SP = { q?: string; role?: string; verified?: string; page?: string };

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.users") };
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const role = ["user", "admin"].includes(sp.role ?? "") ? sp.role! : "all";
  const verified = sp.verified === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const [t, locale, data] = await Promise.all([
    getTranslations("AdminUsers"),
    getLocale(),
    getAdminUsers({ q: sp.q, role, verified, page }),
  ]);
  const href = (patch: Partial<SP>) => {
    const next = { q: sp.q, role, verified: verified ? "1" : undefined, ...patch };
    const qs = new URLSearchParams();
    if (next.q) qs.set("q", next.q);
    if (next.role && next.role !== "all") qs.set("role", next.role);
    if (next.verified) qs.set("verified", "1");
    if (next.page && next.page !== "1") qs.set("page", next.page);
    const s = qs.toString();
    return `/admin/users${s ? `?${s}` : ""}`;
  };
  const from = data.total === 0 ? 0 : (page - 1) * 10 + 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Users")}</h1>
          <p className="text-[15px] text-foreground-secondary">{t("Users sub")}</p>
        </div>
        <AddUserDialog />
      </div>

      <div className="grid grid-cols-3 gap-3.5 md:gap-4">
        <StatCard label={t("Total users")} value={formatNumber(data.stats.total)} />
        <StatCard label={t("New this month")} value={formatNumber(data.stats.newThisMonth)} />
        <StatCard label={t("Admins")} value={formatNumber(data.stats.admins)} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <nav aria-label={t("Role")} className="inline-flex h-[38px] gap-0.5 rounded-[10px] bg-muted p-[3px]">
          {(["all", "user", "admin"] as const).map((r) => (
            <Link key={r} href={href({ role: r, page: undefined })} aria-current={r === role ? "true" : undefined}
              className={cn("flex h-8 items-center rounded-sm px-3 text-[13px] font-semibold", r === role ? "bg-card text-foreground shadow-sm" : "text-foreground-secondary hover:text-foreground")}>
              {r === "all" ? t("All") : t(`roles.${r}`)}
            </Link>
          ))}
        </nav>
        <form role="search" className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-sm border border-input bg-card px-3 focus-within:border-foreground md:max-w-[320px]">
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <label htmlFor="u-q" className="sr-only">{t("Search users")}</label>
          <input id="u-q" name="q" type="search" defaultValue={sp.q} placeholder={t("Name or email")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </form>
        <Link href={href({ verified: verified ? undefined : "1", page: undefined })} aria-pressed={verified}
          className={cn("flex h-9 items-center rounded-sm border px-3 text-[13px] font-semibold", verified ? "border-primary bg-primary text-primary-foreground" : "border-dashed border-muted-foreground bg-card")}>
          {verified ? t("Email verified") : `+ ${t("Email verified")}`}
        </Link>
      </div>

      <section className={cardVariants({ flush: true, className: "overflow-hidden" })}>
        {data.users.length === 0 ? (
          <EmptyState icon={<UsersRound />} title={t("No users")} description={t("No users help")}
            actions={<Link href="/admin/users" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("Clear filters")}</Link>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("col.user")}</TableHead>
                <TableHead>{t("col.role")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("col.email")}</TableHead>
                <TableHead className="hidden text-end md:table-cell">{t("col.orders")}</TableHead>
                <TableHead className="hidden text-end md:table-cell">{t("col.spent")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("col.joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <Link href={`/admin/users/${u._id}`} className="flex items-center gap-2.5">
                      <Avatar name={u.name} size="sm" tone={u.role === "admin" ? "ink" : "soft"} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold hover:underline">{u.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                      </span>
                      {u.isActive === false && <Badge variant="muted" size="sm">{t("Inactive")}</Badge>}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant={u.role === "admin" ? "ink" : "neutral"} size="sm">{t(`roles.${u.role}`)}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={u.emailVerified ? "success" : "warning"} size="sm" dot>{u.emailVerified ? t("Verified") : t("Not verified")}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-end tabular-nums md:table-cell">{u.orders}</TableCell>
                  <TableCell className="hidden text-end font-semibold tabular-nums md:table-cell">{formatMoney(u.spent)}</TableCell>
                  <TableCell className="hidden text-foreground-secondary xl:table-cell">{formatDate(u.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 md:flex-row">
            <span className="text-[13px] text-foreground-secondary tabular-nums">{t("showing", { from, to: Math.min(page * 10, data.total), total: data.total })}</span>
            {data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: String(p) })} />}
          </div>
        )}
      </section>
    </div>
  );
}
