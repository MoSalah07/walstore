import Image from "next/image";
import { ArrowRight, Clock, PackageCheck, Plus, Star, TriangleAlert } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getDashboard } from "@/actions/admin-order.action";
import RevenueChart from "@/components/admin/revenue-chart";
import StatCard from "@/components/admin/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { formatDateTime, formatMoney, formatNumber, ltr } from "@/lib/format";
import { cn } from "@/lib/utils";

const PERIODS = ["today", "7d", "30d", "all"] as const;

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.overview") };
}

function delta(cur: number, prev: number | undefined) {
  if (prev === undefined) return { text: undefined, tone: "flat" as const };
  if (prev === 0) return { text: cur > 0 ? "new" : "0%", tone: cur > 0 ? ("up" as const) : ("flat" as const) };
  const pct = ((cur - prev) / prev) * 100;
  return { text: `${Math.abs(pct).toFixed(1)}%`, tone: pct > 0.05 ? ("up" as const) : pct < -0.05 ? ("down" as const) : ("flat" as const) };
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  const period = PERIODS.includes(sp.period as (typeof PERIODS)[number]) ? sp.period! : "30d";
  const [t, to, tc, locale, d] = await Promise.all([
    getTranslations("Admin"),
    getTranslations("Orders"),
    getTranslations("Categories"),
    getLocale(),
    getDashboard(period),
  ]);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("Good morning") : hour < 18 ? t("Good afternoon") : t("Good evening");
  const prev = d.kpis.prev;
  const vs = t(`vs.${period}`);
  const kpis = [
    { label: t("kpi.revenue"), value: formatMoney(d.kpis.revenue), ...delta(d.kpis.revenue, prev?.revenue) },
    { label: t("kpi.orders"), value: formatNumber(d.kpis.orders), ...delta(d.kpis.orders, prev?.orders) },
    { label: t("kpi.aov"), value: formatMoney(d.kpis.aov), ...delta(d.kpis.aov, prev?.aov) },
    { label: t("kpi.units"), value: formatNumber(d.kpis.units), ...delta(d.kpis.units, prev?.units) },
  ];
  const attention = [
    d.attention.toShip > 0 && { icon: PackageCheck, title: t("orders to ship", { count: d.attention.toShip }), sub: t("Processing not shipped"), cta: t("Review"), href: "/admin/orders?status=processing", tone: "bg-secondary text-foreground" },
    d.attention.lowStock > 0 && { icon: TriangleAlert, title: t("low stock", { count: d.attention.lowStock }), sub: t("15 or fewer"), cta: t("Restock"), href: "/admin/products?stock=low", tone: "bg-deal-subtle text-deal" },
    d.attention.reviews > 0 && { icon: Star, title: t("reviews waiting", { count: d.attention.reviews }), sub: t("Waiting approval"), cta: t("Moderate"), href: "/admin/reviews", tone: "bg-warning-bg text-warning-fg" },
    d.attention.unpaid > 0 && { icon: Clock, title: t("unpaid orders", { count: d.attention.unpaid }), sub: t("Awaiting payment"), cta: t("Review"), href: "/admin/orders?status=unpaid", tone: "bg-warning-bg text-warning-fg" },
  ].filter(Boolean) as { icon: typeof Clock; title: string; sub: string; cta: string; href: string; tone: string }[];
  const chartTotal = d.series.reduce((a, s) => a + s.revenue, 0);
  const maxCat = Math.max(1, ...d.categories.map((c) => c.units));
  const catTotal = d.categories.reduce((a, c) => a + c.units, 0);
  const card = "rounded-[14px] border border-border bg-card";

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">
            {t("greeting", { greet, name: d.adminName.split(" ")[0] })}
          </h1>
          <p className="text-[15px] text-foreground-secondary">{t("Overview sub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <nav aria-label={t("Period")} className="inline-flex h-[38px] gap-0.5 rounded-[10px] bg-muted p-[3px]">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin/overview?period=${p}`}
                aria-current={p === period ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-sm px-3 text-[13px] font-semibold",
                  p === period ? "bg-card text-foreground shadow-sm" : "text-foreground-secondary hover:text-foreground"
                )}
              >
                {t(`period.${p}`)}
              </Link>
            ))}
          </nav>
          <Link href="/admin/products/new" className={cn(buttonVariants({ size: "sm" }), "h-[38px] rounded-[10px]")}>
            <Plus aria-hidden />
            {t("Add product")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} delta={k.text === "new" ? t("new") : k.text} tone={k.tone} note={k.text ? vs : undefined} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section aria-labelledby="attn" className={cn(card, "flex flex-col gap-1.5 p-5")}>
          <h2 id="attn" className="mb-1.5 flex items-center gap-2 text-base font-bold">
            {t("Needs attention")}
            {attention.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-deal px-1.5 text-[11px] text-white">{attention.length}</span>
            )}
          </h2>
          {attention.length === 0 && <p className="py-4 text-sm text-foreground-secondary">{t("All caught up")}</p>}
          {attention.map((a) => (
            <Link key={a.href} href={a.href} className="flex min-h-[60px] items-center gap-3 border-t border-border-soft py-2.5 first-of-type:border-0 hover:bg-background-subtle">
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px]", a.tone)}>
                <a.icon className="size-[18px]" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">{a.title}</span>
                <span className="text-xs text-foreground-secondary">{a.sub}</span>
              </span>
              <span className="flex items-center gap-1 text-[13px] font-bold">
                {a.cta}
                <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
              </span>
            </Link>
          ))}
        </section>

        <section aria-labelledby="rev" className={cn(card, "flex flex-col gap-4 p-5")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 id="rev" className="text-base font-bold">{t("Revenue 14 days")}</h2>
              <span className="text-xs text-foreground-secondary">{t("Revenue note")}</span>
            </div>
            <span className="font-display text-[22px] font-extrabold tabular-nums">{formatMoney(chartTotal)}</span>
          </div>
          <RevenueChart
            data={d.series}
            locale={locale}
            label={t("Revenue chart label", { total: formatMoney(chartTotal) })}
            tableCaption={t("Revenue 14 days")}
            dateLabel={t("Date")}
            revenueLabel={t("kpi.revenue")}
          />
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section aria-labelledby="ro" className={cn(card, "overflow-hidden")}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 id="ro" className="text-base font-bold">{t("Recent orders")}</h2>
            <Link href="/admin/orders" className="text-[13px] font-bold hover:underline">{t("View all")}</Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="border-t border-border-soft px-5 py-8 text-center text-sm text-foreground-secondary">{t("No orders yet")}</p>
          ) : (
            <ul>
              {d.recent.map((o) => (
                <li key={o._id} className="border-t border-border-soft">
                  <Link href={`/admin/orders/${o._id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-background-subtle md:grid-cols-[150px_1fr_130px_100px]">
                    <span className="flex flex-col">
                      <span className="text-sm font-bold" dir="ltr">#{o.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(o.createdAt, locale)}</span>
                    </span>
                    <span className="hidden truncate text-sm md:block">{o.customer}</span>
                    <StatusPill status={o.status} size="sm" className="justify-self-end md:justify-self-start">
                      {to(`status.${o.status}`)}
                    </StatusPill>
                    <span className="text-sm font-bold tabular-nums md:text-end">{formatMoney(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="act" className={cn(card, "flex flex-col p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <h2 id="act" className="text-base font-bold">{t("Activity")}</h2>
            <Link href="/admin/activity" className="text-[13px] font-bold hover:underline">{t("nav.activity")}</Link>
          </div>
          {d.activity.length === 0 && <p className="py-4 text-sm text-foreground-secondary">{t("No activity")}</p>}
          <ol className="flex flex-col gap-3.5">
            {d.activity.map((e) => (
              <li key={e._id} className="flex gap-3">
                <Avatar name={e.actorName} size="sm" tone="soft" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] leading-snug">
                    <strong>{e.actorName}</strong> {t.has(`act.${e.action}`) ? t(`act.${e.action}`) : e.action} {e.entityLabel && ltr(e.entityLabel)}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt, locale)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section aria-labelledby="cat" className={cn(card, "flex flex-col gap-4 p-5")}>
          <div className="flex flex-col gap-0.5">
            <h2 id="cat" className="text-base font-bold">{t("Units by category")}</h2>
            <span className="text-xs text-foreground-secondary">{t("Units note", { total: formatNumber(catTotal) })}</span>
          </div>
          <ul className="flex flex-col gap-3">
            {d.categories.map((c) => (
              <li key={c.name} className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm" title={`${c.name}: ${c.units}`}>
                <span className="truncate text-foreground-secondary">{tc.has(c.name) ? tc(c.name) : c.name}</span>
                <span className="flex items-center gap-2">
                  <span className="h-5 rounded-e-xs bg-foreground" style={{ width: `${(c.units / maxCat) * 80}%` }} />
                  <span className="text-[13px] font-bold tabular-nums">{formatNumber(c.units)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="tp" className={cn(card, "flex flex-col p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <h2 id="tp" className="text-base font-bold">{t("Top products")}</h2>
            <Link href="/admin/products" className="text-[13px] font-bold hover:underline">{t("All products")}</Link>
          </div>
          <ul className="flex flex-col">
            {d.top.map((p) => (
              <li key={p._id} className="flex items-center gap-3 border-t border-border-soft py-2.5 first:border-0">
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-sm bg-sunken dark:bg-[#E9ECF1]">
                  <span className="relative size-[80%]">
                    <Image src={p.images[0]} alt="" fill sizes="44px" className="object-contain mix-blend-multiply" />
                  </span>
                </span>
                <Link href={`/admin/products/${p._id}`} className="line-clamp-1 flex-1 text-sm font-semibold hover:underline">{p.name}</Link>
                <span className="shrink-0 text-[13px] text-foreground-secondary tabular-nums">{t("sold", { count: p.numSales })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
