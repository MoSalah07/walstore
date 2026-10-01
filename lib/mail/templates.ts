import "server-only";
import { getTranslations } from "next-intl/server";

import { formatMoney } from "@/lib/format";
import { getStoreSettings } from "@/lib/settings";
import type { IOrder } from "@/models/order.model";
import type { Email } from "./send";

type Locale = "en" | "ar";
const asLocale = (l?: string): Locale => (l === "ar" ? "ar" : "en");

// Email clients ignore stylesheets and CSS variables, so the brand tokens
// from app/globals.css are repeated here as literal colors.
const C = {
  page: "#F4F5F7",
  card: "#FFFFFF",
  ink: "#0B0D12",
  text: "#1F2430",
  muted: "#5B6170",
  line: "#E4E6EB",
  deal: "#C2410C",
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Block =
  | { type: "p"; text: string; muted?: boolean }
  | { type: "button"; label: string; url: string }
  | { type: "rows"; rows: { label: string; value: string; strong?: boolean; deal?: boolean }[] }
  | { type: "items"; items: { name: string; meta: string; price: string }[] };

async function layout(locale: Locale, { preheader, heading, blocks, link }: { preheader: string; heading: string; blocks: Block[]; link?: string }) {
  const t = await getTranslations({ locale, namespace: "Email" });
  const { storeName, supportEmail } = await getStoreSettings();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const end = locale === "ar" ? "left" : "right";
  const font =
    locale === "ar"
      ? "Cairo, Tahoma, 'Segoe UI', Arial, sans-serif"
      : "'Instrument Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const html = blocks
    .map((b) => {
      if (b.type === "p") {
        return `<p style="margin:0 0 16px;font-size:${b.muted ? 13 : 15}px;line-height:1.6;color:${b.muted ? C.muted : C.text}">${esc(b.text)}</p>`;
      }
      if (b.type === "button") {
        return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:10px;background:${C.ink}"><a href="${esc(b.url)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px">${esc(b.label)}</a></td></tr></table>`;
      }
      if (b.type === "rows") {
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid ${C.line}">${b.rows
          .map(
            (r) =>
              `<tr><td style="padding:10px 0 0;font-size:14px;color:${r.strong ? C.ink : C.muted};font-weight:${r.strong ? 700 : 400};text-align:${align}">${esc(r.label)}</td><td style="padding:10px 0 0;font-size:${r.strong ? 17 : 14}px;font-weight:${r.strong || r.deal ? 700 : 400};color:${r.deal ? C.deal : C.ink};text-align:${end};white-space:nowrap" dir="ltr">${esc(r.value)}</td></tr>`
          )
          .join("")}</table>`;
      }
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${b.items
        .map(
          (i) =>
            `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};text-align:${align}"><div style="font-size:14px;font-weight:600;color:${C.ink}">${esc(i.name)}</div><div style="font-size:13px;color:${C.muted}">${esc(i.meta)}</div></td><td style="padding:10px 0;border-top:1px solid ${C.line};font-size:14px;font-weight:700;color:${C.ink};text-align:${end};white-space:nowrap;vertical-align:top" dir="ltr">${esc(i.price)}</td></tr>`
        )
        .join("")}</table>`;
    })
    .join("\n");

  const fallback = link
    ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${C.muted}">${esc(t("Button not working"))}</p><p style="margin:0 0 16px;font-size:13px;line-height:1.6;word-break:break-all" dir="ltr"><a href="${esc(link)}" style="color:${C.ink}">${esc(link)}</a></p>`
    : "";

  const footer = [t("Footer", { store: storeName }), supportEmail ? t("Footer help", { email: supportEmail }) : ""].filter(Boolean);

  return {
    html: `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${font}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px" dir="${dir}">
<tr><td style="padding:0 4px 20px;text-align:${align}"><span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:9px;background:${C.ink};color:#FFFFFF;font-weight:800;font-size:17px;text-align:center;vertical-align:middle">w</span><span style="font-size:20px;font-weight:800;color:${C.ink};vertical-align:middle;padding:0 8px;letter-spacing:-0.02em">${esc(storeName.toLowerCase())}</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:32px 28px;text-align:${align}">
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:${C.ink}">${esc(heading)}</h1>
${html}
${fallback}
</td></tr>
<tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:${C.muted};text-align:${align}">${footer.map(esc).join("<br>")}</td></tr>
</table></td></tr></table>
</body></html>`,
    text: [
      heading,
      "",
      ...blocks.flatMap((b) =>
        b.type === "p"
          ? [b.text, ""]
          : b.type === "button"
            ? [`${b.label}: ${b.url}`, ""]
            : b.type === "rows"
              ? [...b.rows.map((r) => `${r.label}: ${r.value}`), ""]
              : [...b.items.map((i) => `- ${i.name} (${i.meta}) ${i.price}`), ""]
      ),
      "—",
      ...footer,
    ].join("\n"),
    replyTo: supportEmail || undefined,
  };
}

// ---------- Orders ----------

type OrderForEmail = Pick<
  IOrder,
  "orderNumber" | "items" | "itemsPrice" | "discountPrice" | "promo" | "shippingPrice" | "taxPrice" | "totalPrice" | "shippingAddress" | "shippingMethod"
> & { _id: unknown; locale?: string };

export type OrderEmailKind = "placed" | "shipped" | "delivered" | "cancelled";

export async function orderEmail(kind: OrderEmailKind, order: OrderForEmail, customer: { name: string; email: string }, baseUrl: string): Promise<Email> {
  const locale = asLocale(order.locale);
  const t = await getTranslations({ locale, namespace: "Email" });
  const n = order.orderNumber;
  const total = formatMoney(order.totalPrice);
  const url = `${baseUrl}/${locale}/account/orders/${String(order._id)}`;
  const count = order.items.reduce((a, i) => a + i.quantity, 0);

  const summary: Block = {
    type: "rows",
    rows: [
      { label: t("Items n", { count }), value: formatMoney(order.itemsPrice) },
      ...(order.discountPrice > 0
        ? [{ label: order.promo ? `${t("Discount")} (${order.promo.code})` : t("Discount"), value: `−${formatMoney(order.discountPrice)}`, deal: true }]
        : []),
      { label: t(order.shippingMethod === "express" ? "Express shipping" : "Standard shipping"), value: order.shippingPrice === 0 ? t("Free") : formatMoney(order.shippingPrice) },
      ...(order.taxPrice > 0 ? [{ label: t("Tax"), value: formatMoney(order.taxPrice) }] : []),
      { label: t("Total"), value: total, strong: true },
    ],
  };
  const items: Block = {
    type: "items",
    items: order.items.map((i) => ({
      name: i.name,
      meta: [i.color, i.size, `${t("Qty")} ${i.quantity}`].filter(Boolean).join(" · "),
      price: formatMoney(i.price * i.quantity),
    })),
  };
  const a = order.shippingAddress;
  const address = `${a.fullName}, ${a.street}, ${a.city}, ${a.province} ${a.postalCode}`;

  const hi: Block = { type: "p", text: t("Hi", { name: customer.name }) };
  const button: Block = { type: "button", label: t("View your order"), url };
  const blocks: Record<OrderEmailKind, Block[]> = {
    placed: [hi, { type: "p", text: t("placed.intro", { number: n, total }) }, button, items, summary, { type: "p", text: `${t("Ship to")}: ${address}`, muted: true }],
    shipped: [hi, { type: "p", text: t("shipped.intro", { number: n, total }) }, button, summary],
    delivered: [hi, { type: "p", text: t("delivered.intro", { number: n }) }, button],
    cancelled: [hi, { type: "p", text: t("cancelled.intro", { number: n }) }, button, items],
  };

  const heading = t(`${kind}.heading`);
  const body = await layout(locale, { preheader: t(`${kind}.subject`, { number: n }), heading, blocks: blocks[kind], link: url });
  return { to: customer.email, subject: t(`${kind}.subject`, { number: n }), ...body };
}

// ---------- Account ----------

export async function accountEmail(kind: "reset-password" | "verify-email", user: { name: string; email: string }, link: string, locale?: string): Promise<Email> {
  const l = asLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "Email" });
  const { storeName } = await getStoreSettings();
  const body = await layout(l, {
    preheader: t(`${kind}.intro`, { email: user.email }),
    heading: t(`${kind}.heading`),
    link,
    blocks: [
      { type: "p", text: t("Hi", { name: user.name }) },
      { type: "p", text: t(`${kind}.intro`, { email: user.email }) },
      { type: "button", label: t(`${kind}.cta`), url: link },
      { type: "p", text: t(`${kind}.ignore`), muted: true },
    ],
  });
  return { to: user.email, subject: t(`${kind}.subject`, { store: storeName }), ...body };
}
