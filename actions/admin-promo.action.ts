"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import connectToDatabase from "@/lib/connect.db";
import { normalizeCode } from "@/lib/promo";
import { isAdmin } from "@/lib/roles";
import Order from "@/models/order.model";
import PromoCode, { IPromoCode, PromoStatus } from "@/models/promo-code.model";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) throw new Error("Forbidden");
  await connectToDatabase();
  return session;
}

export type PromoCodeDTO = Omit<IPromoCode, "_id" | "startsAt" | "endsAt" | "createdAt" | "updatedAt"> & {
  _id: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  status: PromoStatus;
  discountGiven: number;
};

const promoStatus = (p: IPromoCode, now: Date): PromoStatus =>
  !p.isActive
    ? "inactive"
    : p.endsAt && p.endsAt < now
      ? "expired"
      : p.usageLimit != null && p.usedCount >= p.usageLimit
        ? "used-up"
        : p.startsAt && p.startsAt > now
          ? "scheduled"
          : "active";

// Stores keep a handful of codes, so filter and page in memory.
export async function getAdminPromoCodes({ q, status = "all", page = 1, limit = 20 }: { q?: string; status?: string; page?: number; limit?: number }) {
  await assertAdmin();
  const now = new Date();
  const [codes, given] = await Promise.all([
    PromoCode.find().sort({ createdAt: -1 }).lean(),
    Order.aggregate<{ _id: string; amount: number }>([
      { $match: { "promo.code": { $exists: true }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$promo.code", amount: { $sum: "$discountPrice" } } },
    ]),
  ]);
  const givenBy = new Map(given.map((g) => [g._id, g.amount]));
  const all: PromoCodeDTO[] = codes.map((c) => ({
    ...(JSON.parse(JSON.stringify(c)) as Omit<PromoCodeDTO, "status" | "discountGiven">),
    status: promoStatus(c, now),
    discountGiven: givenBy.get(c.code) ?? 0,
  }));
  const needle = q ? normalizeCode(q) : "";
  const filtered = all.filter(
    (c) =>
      (status === "all" || c.status === status) &&
      (!needle || c.code.includes(needle) || c.description?.toUpperCase().includes(q!.trim().toUpperCase()))
  );
  return {
    codes: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    stats: {
      total: all.length,
      active: all.filter((c) => c.status === "active").length,
      uses: all.reduce((n, c) => n + c.usedCount, 0),
      discountGiven: all.reduce((n, c) => n + c.discountGiven, 0),
    },
  };
}

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), schema.nullable());
const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
);

const PromoInputSchema = z
  .object({
    code: z.string().transform(normalizeCode).pipe(z.string().regex(/^[A-Z0-9_-]{3,20}$/)),
    description: z.string().trim().max(120).optional(),
    kind: z.enum(["percent", "fixed"]),
    value: z.coerce.number().positive().max(100000),
    maxDiscount: optionalNumber(z.coerce.number().positive().max(100000)),
    minOrder: z.coerce.number().min(0).max(1000000),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: optionalNumber(z.coerce.number().int().min(1).max(1000000)),
    perUserLimit: z.coerce.number().int().min(0).max(1000),
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.kind === "percent" && d.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "max100" });
    if (d.startsAt && d.endsAt && d.endsAt < d.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "order" });
  });

// Raw form values; the schema coerces and checks them.
export type PromoInput = Record<string, string | number | boolean | null>;
type SaveResult = { ok: true; id: string } | { ok: false; error: "invalid" | "code-taken" | "code-locked" | "missing"; fields?: string[] };

// Dates are whole days: a code runs from the start of its first day to the
// end of its last day (server time).
const dayStart = (d: string | null) => (d ? new Date(`${d}T00:00:00`) : null);
const dayEnd = (d: string | null) => (d ? new Date(`${d}T23:59:59.999`) : null);

export async function savePromoCode(id: string | null, input: PromoInput): Promise<SaveResult> {
  const session = await assertAdmin();
  const parsed = PromoInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: Object.keys(parsed.error.flatten().fieldErrors) };
  const d = parsed.data;
  const doc = {
    code: d.code,
    description: d.description || undefined,
    kind: d.kind,
    value: d.value,
    maxDiscount: d.kind === "percent" ? d.maxDiscount : null,
    minOrder: d.minOrder,
    startsAt: dayStart(d.startsAt),
    endsAt: dayEnd(d.endsAt),
    usageLimit: d.usageLimit,
    perUserLimit: d.perUserLimit,
    isActive: d.isActive,
  };

  const taken = await PromoCode.exists({ code: d.code, ...(id ? { _id: { $ne: id } } : {}) });
  if (taken) return { ok: false, error: "code-taken", fields: ["code"] };

  if (!id) {
    const created = await PromoCode.create(doc);
    await logActivity({ actor: session.user, action: "created promo code", entity: "promo", entityId: String(created._id), entityLabel: created.code });
    revalidatePath("/admin/promo-codes");
    return { ok: true, id: String(created._id) };
  }

  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "missing" };
  const before = await PromoCode.findById(id);
  if (!before) return { ok: false, error: "missing" };
  // Orders point at a code by name; renaming a used one would orphan them.
  if (before.code !== d.code && before.usedCount > 0) return { ok: false, error: "code-locked", fields: ["code"] };
  const diff: string[] = [];
  if (before.code !== d.code) diff.push(`code: ${before.code} → ${d.code}`);
  if (before.kind !== d.kind || before.value !== d.value) diff.push(`discount: ${before.value}${before.kind === "percent" ? "%" : "$"} → ${d.value}${d.kind === "percent" ? "%" : "$"}`);
  if (before.isActive !== d.isActive) diff.push(d.isActive ? "activated" : "deactivated");
  before.set(doc);
  await before.save();
  await logActivity({ actor: session.user, action: "updated promo code", entity: "promo", entityId: id, entityLabel: d.code, diff: diff.join(" · ") || undefined });
  revalidatePath("/admin/promo-codes");
  return { ok: true, id };
}

export async function setPromoActive(id: string, active: boolean): Promise<{ ok: boolean }> {
  const session = await assertAdmin();
  if (!Types.ObjectId.isValid(id)) return { ok: false };
  const promo = await PromoCode.findByIdAndUpdate(id, { isActive: active });
  if (!promo) return { ok: false };
  await logActivity({ actor: session.user, action: active ? "activated promo code" : "deactivated promo code", entity: "promo", entityId: id, entityLabel: promo.code });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

// Only codes nobody has ordered with; used ones are deactivated instead so
// their orders keep making sense.
export async function deletePromoCode(id: string): Promise<{ ok: boolean; error?: "used" | "missing" }> {
  const session = await assertAdmin();
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "missing" };
  const promo = await PromoCode.findById(id);
  if (!promo) return { ok: false, error: "missing" };
  if (promo.usedCount > 0 || (await Order.exists({ "promo.code": promo.code }))) return { ok: false, error: "used" };
  await promo.deleteOne();
  await logActivity({ actor: session.user, action: "deleted promo code", entity: "promo", entityLabel: promo.code });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}
