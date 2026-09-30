import { Search, TicketPercent } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAdminPromoCodes } from "@/actions/admin-promo.action";
import StatCard from "@/components/admin/stat-card";
import Pagination from "@/components/shared/pagination/pagination";
import { StatusPill } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PROMO_STATUSES } from "@/models/promo-code.model";
import { NewPromoButton, PromoRow, PromoRowActions } from "./promo-code-dialogs";

type SP = { q?: string; status?: string; page?: string };
const LIMIT = 20;

// Dates go to the form as YYYY-MM-DD in store (server) time, as they were saved.
const day = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const str = (n: number | null | undefined) => (n == null ? "" : String(n));

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.promo") };
}

export default async function AdminPromoCodesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = (PROMO_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const [t, locale, data] = await Promise.all([
    getTranslations("AdminPromo"),
    getLocale(),
    getAdminPromoCodes({ q: sp.q, status, page, limit: LIMIT }),
  ]);
  const href = (patch: Partial<SP>) => {
    const next = { q: sp.q, status, ...patch };
    const qs = new URLSearchParams();
    if (next.q) qs.set("q", next.q);
    if (next.status && next.status !== "all") qs.set("status", next.status);
    if (next.page && next.page !== "1") qs.set("page", next.page);
    const s = qs.toString();
    return `/admin/promo-codes${s ? `?${s}` : ""}`;
  };
  const from = data.total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const filtered = !!sp.q || status !== "all";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Title")}</h1>
          <p className="text-[15px] text-foreground-secondary">{t("Sub")}</p>
        </div>
        <NewPromoButton />
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-4">
        <StatCard label={t("Total codes")} value={formatNumber(data.stats.total)} />
        <StatCard label={t("Active now")} value={formatNumber(data.stats.active)} />
        <StatCard label={t("Times used")} value={formatNumber(data.stats.uses)} />
        <StatCard label={t("Discount given")} value={formatMoney(data.stats.discountGiven)} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <nav aria-label={t("Status")} className="inline-flex h-[38px] max-w-full gap-0.5 overflow-x-auto rounded-[10px] bg-muted p-[3px] scrollbar-none">
          {(["all", ...PROMO_STATUSES] as const).map((s) => (
            <Link key={s} href={href({ status: s, page: undefined })} aria-current={s === status ? "true" : undefined}
              className={cn("flex h-8 shrink-0 items-center rounded-sm px-3 text-[13px] font-semibold", s === status ? "bg-card text-foreground shadow-sm" : "text-foreground-secondary hover:text-foreground")}>
              {t(`status.${s}`)}
            </Link>
          ))}
        </nav>
        <form role="search" className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-sm border border-input bg-card px-3 focus-within:border-foreground md:max-w-[320px]">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <label htmlFor="pc-q" className="sr-only">{t("Search codes")}</label>
          <input id="pc-q" name="q" type="search" defaultValue={sp.q} placeholder={t("Search placeholder")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </form>
      </div>

      <section className={cardVariants({ flush: true, className: "overflow-hidden" })}>
        {data.codes.length === 0 ? (
          <EmptyState
            icon={<TicketPercent />}
            title={filtered ? t("No match") : t("Empty title")}
            description={filtered ? t("No match help") : t("Empty help")}
            actions={filtered ? <Link href="/admin/promo-codes" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("Clear filters")}</Link> : <NewPromoButton />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("col.code")}</TableHead>
                <TableHead>{t("col.discount")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("col.min")}</TableHead>
                <TableHead className="text-end">{t("col.uses")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("col.valid")}</TableHead>
                <TableHead>{t("col.status")}</TableHead>
                <TableHead><span className="sr-only">{t("col.actions")}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.codes.map((c) => {
                const row: PromoRow = {
                  _id: c._id,
                  usedCount: c.usedCount,
                  code: c.code,
                  description: c.description ?? "",
                  kind: c.kind,
                  value: String(c.value),
                  maxDiscount: str(c.maxDiscount),
                  minOrder: String(c.minOrder),
                  startsAt: day(c.startsAt),
                  endsAt: day(c.endsAt),
                  usageLimit: str(c.usageLimit),
                  perUserLimit: String(c.perUserLimit),
                  isActive: c.isActive,
                };
                return (
                  <TableRow key={c._id}>
                    <TableCell>
                      <span className="flex min-w-0 flex-col">
                        <span dir="ltr" className="self-start font-bold tracking-wide">{c.code}</span>
                        {c.description && <span className="line-clamp-1 text-xs text-muted-foreground">{c.description}</span>}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <span className="font-semibold">{c.kind === "percent" ? `${c.value}%` : formatMoney(c.value)}</span>
                      {c.kind === "percent" && c.maxDiscount ? (
                        <span className="block text-xs text-muted-foreground">{t("up to", { amount: formatMoney(c.maxDiscount) })}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden tabular-nums text-foreground-secondary md:table-cell">
                      {c.minOrder > 0 ? formatMoney(c.minOrder) : "—"}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      <span className="font-semibold">{formatNumber(c.usedCount)}</span>
                      <span className="text-muted-foreground"> / {c.usageLimit ? formatNumber(c.usageLimit) : "∞"}</span>
                      {c.discountGiven > 0 && <span className="block text-xs text-muted-foreground">{formatMoney(c.discountGiven)}</span>}
                    </TableCell>
                    <TableCell className="hidden text-foreground-secondary lg:table-cell">
                      {c.startsAt || c.endsAt
                        ? `${c.startsAt ? formatDate(c.startsAt, locale) : "…"} – ${c.endsAt ? formatDate(c.endsAt, locale) : "…"}`
                        : t("Always")}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={c.status} size="sm">{t(`status.${c.status}`)}</StatusPill>
                    </TableCell>
                    <TableCell className="w-10 text-end">
                      <PromoRowActions promo={row} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {data.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 md:flex-row">
            <span className="text-[13px] text-foreground-secondary tabular-nums">{t("showing", { from, to: Math.min(page * LIMIT, data.total), total: data.total })}</span>
            {data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: String(p) })} />}
          </div>
        )}
      </section>
    </div>
  );
}
