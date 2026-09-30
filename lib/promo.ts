import "server-only";
import { Types } from "mongoose";

import type { PromoRule } from "./pricing";
import Order from "@/models/order.model";
import PromoCode, { IPromoCode } from "@/models/promo-code.model";

export type PromoError = "missing" | "inactive" | "not-started" | "expired" | "min-order" | "used-up" | "per-user";

export type PromoCheck =
  | { ok: true; promo: IPromoCode; rule: PromoRule }
  | { ok: false; error: PromoError; minOrder?: number };

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

// Can this customer use the code on an order with this items subtotal?
// Expects an open database connection.
export async function checkPromo(code: string, userId: string, itemsPrice: number, now = new Date()): Promise<PromoCheck> {
  const promo = await PromoCode.findOne({ code: normalizeCode(code) }).lean();
  if (!promo) return { ok: false, error: "missing" };
  if (!promo.isActive) return { ok: false, error: "inactive" };
  if (promo.startsAt && promo.startsAt > now) return { ok: false, error: "not-started" };
  if (promo.endsAt && promo.endsAt < now) return { ok: false, error: "expired" };
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) return { ok: false, error: "used-up" };
  if (itemsPrice < promo.minOrder) return { ok: false, error: "min-order", minOrder: promo.minOrder };
  if (promo.perUserLimit > 0) {
    const used = await Order.countDocuments({
      user: new Types.ObjectId(userId),
      "promo.code": promo.code,
      status: { $ne: "cancelled" },
    });
    if (used >= promo.perUserLimit) return { ok: false, error: "per-user" };
  }
  return { ok: true, promo, rule: { kind: promo.kind, value: promo.value, maxDiscount: promo.maxDiscount } };
}

// Takes one use, unless the last one went to someone else in the meantime.
export async function reservePromo(id: Types.ObjectId) {
  const res = await PromoCode.updateOne(
    { _id: id, $expr: { $lt: ["$usedCount", { $ifNull: ["$usageLimit", Number.MAX_SAFE_INTEGER] }] } },
    { $inc: { usedCount: 1 } }
  );
  return res.modifiedCount === 1;
}

// Gives a use back when an order that used the code is cancelled or fails.
export async function releasePromo(code?: string | null) {
  if (!code) return;
  await PromoCode.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}
