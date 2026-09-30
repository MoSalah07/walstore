import { History } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getActivityLog } from "@/actions/admin-system.action";
import Pagination from "@/components/shared/pagination/pagination";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatDate, formatDateTime, ltr } from "@/lib/format";
import { cn } from "@/lib/utils";

const ENTITIES = ["all", "order", "product", "user", "review", "promo", "settings"] as const;
const PERIODS = ["1d", "7d", "30d", "all"] as const;

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.activity") };
}

const entityHref = (entity: string, id?: string) =>
  !id ? undefined : entity === "order" ? `/admin/orders/${id}` : entity === "product" ? `/admin/products/${id}` : entity === "user" ? `/admin/users/${id}` : entity === "review" ? "/admin/reviews" : entity === "promo" ? "/admin/promo-codes" : undefined;

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<{ entity?: string; period?: string; page?: string }> }) {
  const sp = await searchParams;
  const entity = ENTITIES.includes(sp.entity as (typeof ENTITIES)[number]) ? sp.entity! : "all";
  const period = PERIODS.includes(sp.period as (typeof PERIODS)[number]) ? sp.period! : "7d";
  const page = Math.max(1, Number(sp.page) || 1);
  const [t, ta, locale, data] = await Promise.all([
    getTranslations("AdminActivity"),
    getTranslations("Admin"),
    getLocale(),
    getActivityLog({ entity, period, page }),
  ]);
  const href = (patch: { entity?: string; period?: string; page?: string }) => {
    const n = { entity, period, ...patch };
    const q = new URLSearchParams();
    if (n.entity !== "all") q.set("entity", n.entity);
    if (n.period !== "7d") q.set("period", n.period);
    if (n.page && n.page !== "1") q.set("page", n.page);
    const s = q.toString();
    return `/admin/activity${s ? `?${s}` : ""}`;
  };

  // Group by calendar day.
  const days = new Map<string, typeof data.events>();
  for (const e of data.events) {
    const key = new Date(e.createdAt).toDateString();
    days.set(key, [...(days.get(key) ?? []), e]);
  }
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Title")}</h1>
        <p className="text-[15px] text-foreground-secondary">{t("Sub")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <nav aria-label={t("Type")} className="flex flex-wrap gap-2">
          {ENTITIES.map((e) => (
            <Link key={e} href={href({ entity: e, page: undefined })} aria-current={e === entity ? "true" : undefined}
              className={cn("flex h-9 items-center rounded-full border px-3 text-[13px] font-semibold", e === entity ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-foreground")}>
              {t(`entity.${e}`)}
            </Link>
          ))}
        </nav>
        <nav aria-label={t("Period")} className="ms-auto inline-flex h-9 gap-0.5 rounded-[10px] bg-muted p-[3px]">
          {PERIODS.map((p) => (
            <Link key={p} href={href({ period: p, page: undefined })} aria-current={p === period ? "true" : undefined}
              className={cn("flex h-[30px] items-center rounded-sm px-3 text-[13px] font-semibold", p === period ? "bg-card shadow-sm" : "text-foreground-secondary")}>
              {t(`period.${p}`)}
            </Link>
          ))}
        </nav>
      </div>

      <section className={cardVariants({ flush: true, className: "px-5 pb-4 pt-2 md:px-6" })}>
        {data.events.length === 0 ? (
          <EmptyState icon={<History />} title={t("Empty")} description={t("Empty help")} />
        ) : (
          [...days.entries()].map(([day, events]) => (
            <div key={day} className="flex flex-col">
              <h2 className="type-overline mb-2 mt-4 text-muted-foreground">
                {day === today ? `${t("Today")} · ` : day === yesterday ? `${t("Yesterday")} · ` : ""}
                {formatDate(events[0].createdAt, locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </h2>
              <ol>
                {events.map((e) => {
                  const link = entityHref(e.entity, e.entityId);
                  return (
                    <li key={e._id} className="flex items-start gap-4 border-b border-border-soft py-3 last:border-0">
                      <span className="w-[72px] shrink-0 whitespace-nowrap pt-1.5 text-[13px] text-muted-foreground tabular-nums">
                        {formatDateTime(e.createdAt, locale).split(", ").pop()}
                      </span>
                      <Avatar name={e.actorName} size="sm" tone="soft" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm leading-relaxed">
                          <strong>{e.actorName}</strong> {ta.has(`act.${e.action}`) ? ta(`act.${e.action}`) : e.action}{" "}
                          {e.entityLabel && (link ? <Link href={link} className="font-semibold hover:underline">{ltr(e.entityLabel)}</Link> : <span className="font-semibold">{ltr(e.entityLabel)}</span>)}
                        </span>
                        {e.diff && <code dir="ltr" className="self-start rounded-[6px] border border-border-soft bg-background-subtle px-2 py-0.5 text-xs text-primary-hover dark:text-foreground-secondary">{e.diff}</code>}
                      </span>
                      <span className="hidden shrink-0 rounded-[6px] bg-sunken px-2 py-0.5 text-xs font-semibold text-foreground-secondary sm:inline">{t(`entity.${e.entity}`)}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))
        )}
      </section>
      {data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: String(p) })} />}
    </div>
  );
}
