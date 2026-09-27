"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { AdminOrderRow, setOrderStatus, shipOrders } from "@/actions/admin-order.action";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cardVariants } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/routing";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/models/order.model";

export default function OrdersTable({ orders, locale }: { orders: AdminOrderRow[]; locale: string }) {
  const t = useTranslations("Admin");
  const to = useTranslations("Orders");
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const all = orders.length > 0 && selected.length === orders.length;

  const act = (id: string, status: OrderStatus) =>
    start(async () => {
      const r = await setOrderStatus(id, status);
      if (r.ok) toast.success(t("Order updated"));
      else toast.error(t("Order update failed"));
      router.refresh();
    });

  return (
    <>
      {selected.length > 0 && (
        <div role="region" aria-label={t("Bulk actions")} className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary px-5 py-2.5 text-sm">
          <span className="font-bold">{t("n selected", { count: selected.length })}</span>
          <Button
            size="sm"
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await shipOrders(selected);
                toast.success(t("n shipped", { count: r.count }));
                setSelected([]);
                router.refresh();
              })
            }
          >
            {t("Mark as shipped")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            {t("Clear selection")}
          </Button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  aria-label={t("Select all")}
                  checked={all ? true : selected.length ? "indeterminate" : false}
                  onCheckedChange={(v) => setSelected(v === true ? orders.map((o) => o._id) : [])}
                />
              </TableHead>
              <TableHead>{t("col.order")}</TableHead>
              <TableHead>{t("col.customer")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("col.items")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("col.payment")}</TableHead>
              <TableHead>{t("col.status")}</TableHead>
              <TableHead className="text-end">{t("col.total")}</TableHead>
              <TableHead className="w-12"><span className="sr-only">{t("col.actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const sel = selected.includes(o._id);
              const name = o.customer?.name ?? o.shippingAddress.fullName;
              const items = o.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <TableRow key={o._id} data-state={sel ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      aria-label={t("Select order", { number: o.orderNumber })}
                      checked={sel}
                      onCheckedChange={(v) => setSelected((s) => (v === true ? [...s, o._id] : s.filter((x) => x !== o._id)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/orders/${o._id}`} className="block font-bold hover:underline" dir="ltr">
                      #{o.orderNumber}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDateTime(o.createdAt, locale)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={name} size="sm" tone="soft" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">{name}</span>
                        {o.customer?.email && <span className="truncate text-xs text-muted-foreground">{o.customer.email}</span>}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">{t("items n", { count: items })}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {to(`payment.${o.paymentMethod}`)}
                    {o.isPaid && <span className="ms-1.5 text-xs font-semibold text-success-fg">· {t("Paid")}</span>}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={o.status} size="sm">{to(`status.${o.status}`)}</StatusPill>
                  </TableCell>
                  <TableCell className="text-end font-bold tabular-nums">{formatMoney(o.totalPrice)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger aria-label={t("Order actions", { number: o.orderNumber })} className="flex size-8 items-center justify-center rounded-sm hover:bg-sunken">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/orders/${o._id}`}>{t("View order")}</Link>
                        </DropdownMenuItem>
                        {o.status === "processing" && <DropdownMenuItem onSelect={() => act(o._id, "shipped")}>{t("Mark as shipped")}</DropdownMenuItem>}
                        {o.status === "shipped" && <DropdownMenuItem onSelect={() => act(o._id, "delivered")}>{t("Mark as delivered")}</DropdownMenuItem>}
                        {["unpaid", "processing", "shipped"].includes(o.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => act(o._id, "cancelled")}>
                              {t("Cancel order")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Phone cards */}
      <ul className="flex flex-col gap-2.5 p-3 md:hidden">
        {orders.map((o) => (
          <li key={o._id}>
            <Link href={`/admin/orders/${o._id}`} className={cardVariants({ flush: true, className: "flex flex-col gap-2 p-3.5" })}>
              <span className="flex justify-between font-bold">
                <span dir="ltr">#{o.orderNumber}</span>
                <span className="tabular-nums">{formatMoney(o.totalPrice)}</span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] text-foreground-secondary">
                  {o.customer?.name ?? o.shippingAddress.fullName} · {t("items n", { count: o.items.reduce((n, i) => n + i.quantity, 0) })} · {to(`payment.${o.paymentMethod}`)}
                </span>
                <StatusPill status={o.status} size="sm">{to(`status.${o.status}`)}</StatusPill>
              </span>
              <span className="text-xs text-muted-foreground">{formatDateTime(o.createdAt, locale)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
