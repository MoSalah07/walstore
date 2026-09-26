import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAdminUser } from "@/actions/admin-user.action";
import { auth } from "@/auth";
import StatCard from "@/components/admin/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusPill, StatusKey } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/routing";
import { formatDate, formatDateTime, formatMoney, ltr } from "@/lib/format";
import { ActiveToggle, DeleteUserDialog, EditUserDrawer } from "../user-dialogs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminUser(id);
  return { title: data?.user.name ?? "404" };
}

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session, t, ta, to, locale] = await Promise.all([
    getAdminUser(id),
    auth(),
    getTranslations("AdminUsers"),
    getTranslations("Admin"),
    getTranslations("Orders"),
    getLocale(),
  ]);
  if (!data) notFound();
  const { user, orders, activity, stats } = data;
  const self = session?.user?.id === user._id;
  const region = new Intl.DisplayNames([locale], { type: "region" });
  const def = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
  const card = "rounded-[14px] border border-border bg-card";

  const sub = [
    user.email,
    t("Joined", { date: formatDate(user.createdAt, locale) }),
    orders[0] && t("Last order", { date: formatDate(orders[0].createdAt, locale) }),
    user.lastLoginAt && t("Last sign in", { date: formatDateTime(user.lastLoginAt, locale) }),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/users" className="flex items-center gap-1.5 self-start text-sm font-semibold text-foreground-secondary hover:text-foreground">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t("All users")}
      </Link>
      <section className="flex flex-col gap-4 md:flex-row md:items-center">
        <Avatar name={user.name} size="lg" className="size-16 text-xl" tone={user.role === "admin" ? "ink" : "soft"} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em]">{user.name}</h1>
            <Badge variant={user.role === "admin" ? "ink" : "neutral"} size="sm">{t(`roles.${user.role}`)}</Badge>
            <Badge variant={user.emailVerified ? "success" : "warning"} size="sm" dot>{user.emailVerified ? t("Email verified") : t("Not verified")}</Badge>
            {user.isActive === false && <Badge variant="muted" size="sm">{t("Inactive")}</Badge>}
            {self && <Badge variant="info" size="sm">{t("You")}</Badge>}
          </div>
          <span className="text-sm text-foreground-secondary">{sub.join(" · ")}</span>
        </div>
        {!self && (
          <div className="flex flex-wrap gap-2">
            <DeleteUserDialog user={user} orders={orders.length} />
            <ActiveToggle id={user._id} active={user.isActive !== false} />
            <EditUserDrawer user={user} />
          </div>
        )}
        {self && <EditUserDrawer user={user} />}
      </section>

      <div className="grid grid-cols-3 gap-3.5 md:gap-4">
        <StatCard label={t("Orders")} value={stats.orders} />
        <StatCard label={t("Total spent")} value={formatMoney(stats.spent)} />
        <StatCard label={t("Average order")} value={formatMoney(stats.avg)} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={card}>
          <Tabs defaultValue="orders">
            <TabsList className="px-5">
              <TabsTrigger value="orders">{t("Orders")}</TabsTrigger>
              <TabsTrigger value="addresses">{t("Addresses")}</TabsTrigger>
              <TabsTrigger value="activity">{t("Activity")}</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-0">
              {orders.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-foreground-secondary">{t("No orders")}</p>
              ) : (
                <ul>
                  {orders.map((o) => (
                    <li key={o._id} className="border-b border-border-soft last:border-0">
                      <Link href={`/admin/orders/${o._id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-background-subtle md:grid-cols-[120px_1fr_90px_120px_100px]">
                        <span className="font-bold" dir="ltr">#{o.orderNumber}</span>
                        <span className="text-sm text-foreground-secondary md:order-none">{formatDate(o.createdAt, locale)}</span>
                        <span className="hidden text-sm text-foreground-secondary md:block">{ta("items n", { count: o.items.reduce((n, i) => n + i.quantity, 0) })}</span>
                        <StatusPill status={o.status as StatusKey} size="sm">{to(`status.${o.status}`)}</StatusPill>
                        <span className="text-end font-bold tabular-nums">{formatMoney(o.totalPrice)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="addresses" className="mt-0 p-5">
              {user.addresses?.length ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {user.addresses.map((a, i) => (
                    <li key={i} className="rounded-md border border-border p-4 text-sm leading-relaxed">
                      <strong>{a.fullName}</strong> {a.isDefault && <Badge variant="ink" size="sm" className="ms-1">{t("Default")}</Badge>}
                      <br />{a.street}<br />{a.city}, {a.province} {a.postalCode}, {region.of(a.country) ?? a.country}
                      <br /><span dir="ltr">{a.phone}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-foreground-secondary">{t("No addresses")}</p>
              )}
            </TabsContent>
            <TabsContent value="activity" className="mt-0 p-5">
              {activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-foreground-secondary">{t("No activity")}</p>
              ) : (
                <ol className="flex flex-col gap-3.5">
                  {activity.map((e) => (
                    <li key={e._id} className="flex flex-col gap-0.5 text-sm">
                      <span><strong>{e.actorName}</strong> {ta.has(`act.${e.action}`) ? ta(`act.${e.action}`) : e.action} {e.entityLabel && ltr(e.entityLabel)}</span>
                      {e.diff && <code className="self-start rounded-[6px] border border-border-soft bg-background-subtle px-2 py-0.5 text-xs" dir="ltr">{e.diff}</code>}
                      <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt, locale)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        </section>
        <aside className={`${card} flex flex-col gap-2 p-5 text-sm leading-relaxed`}>
          <h2 className="text-base font-bold">{t("Default address")}</h2>
          {def ? (
            <span>{def.fullName}<br />{def.street}<br />{def.city}, {def.province} {def.postalCode}<br />{region.of(def.country) ?? def.country}</span>
          ) : (
            <span className="text-foreground-secondary">{t("No addresses")}</span>
          )}
          <h2 className="mt-3 text-base font-bold">{t("Preferred payment")}</h2>
          <span>{orders[0] ? to(`payment.${orders[0].paymentMethod}`) : "—"}</span>
        </aside>
      </div>
    </div>
  );
}
