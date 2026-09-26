"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import connectToDatabase from "@/lib/connect.db";
import { isAdmin } from "@/lib/roles";
import { getStoreSettings } from "@/lib/settings";
import Activity from "@/models/activity.model";
import Settings from "@/models/settings.model";
import User from "@/models/user.model";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) throw new Error("Forbidden");
  await connectToDatabase();
  return session;
}

const toJSON = <T,>(x: unknown) => JSON.parse(JSON.stringify(x)) as T;

// ---------- Settings ----------

export async function getSettingsForAdmin() {
  await assertAdmin();
  return getStoreSettings();
}

const money = z.coerce.number().min(0).max(100000);
const SettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(60),
  supportEmail: z.union([z.literal(""), z.string().trim().email()]),
  supportPhone: z.string().trim().max(30),
  freeShippingMin: money,
  standardShipping: money,
  expressShipping: money,
  taxPercent: z.coerce.number().min(0).max(50),
});

export async function saveSettings(input: Record<string, string | number>): Promise<{ ok: boolean; fields?: Record<string, string[]> }> {
  const session = await assertAdmin();
  const parsed = SettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  const before = await getStoreSettings();
  const d = parsed.data;
  const round = (n: number) => Math.round(n * 100) / 100;
  await Settings.updateOne(
    { _id: "store" },
    {
      $set: {
        storeName: d.storeName,
        supportEmail: d.supportEmail,
        supportPhone: d.supportPhone,
        freeShippingMin: round(d.freeShippingMin),
        standardShipping: round(d.standardShipping),
        expressShipping: round(d.expressShipping),
        taxRate: round(d.taxPercent) / 100,
      },
    },
    { upsert: true }
  );
  const diff: string[] = [];
  if (before.pricing.freeShippingMin !== d.freeShippingMin) diff.push(`freeShippingMin: ${before.pricing.freeShippingMin} → ${d.freeShippingMin}`);
  if (before.pricing.standard !== d.standardShipping) diff.push(`standard: ${before.pricing.standard} → ${d.standardShipping}`);
  if (before.pricing.express !== d.expressShipping) diff.push(`express: ${before.pricing.express} → ${d.expressShipping}`);
  if (before.pricing.taxRate * 100 !== d.taxPercent) diff.push(`tax: ${before.pricing.taxRate * 100}% → ${d.taxPercent}%`);
  await logActivity({ actor: session.user, action: "updated store settings", entity: "settings", diff: diff.join(" · ") || undefined });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Roles ----------

export async function getRoleMembers() {
  await assertAdmin();
  const [admins, customers, adminList] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: { $ne: "admin" } }),
    User.find({ role: "admin" }).select("name").limit(5).lean(),
  ]);
  return { admins, customers, adminNames: adminList.map((u) => u.name) };
}

// ---------- Activity ----------

const DAYS: Record<string, number | null> = { "1d": 1, "7d": 7, "30d": 30, all: null };

export async function getActivityLog({ entity = "all", period = "7d", page = 1, limit = 40 }: { entity?: string; period?: string; page?: number; limit?: number }) {
  await assertAdmin();
  const filter: Record<string, unknown> = {};
  if (entity !== "all") filter.entity = entity;
  const days = DAYS[period] ?? 7;
  if (days) filter.createdAt = { $gte: new Date(Date.now() - days * 86400000) };
  const [rows, total] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Activity.countDocuments(filter),
  ]);
  return {
    events: toJSON<{ _id: string; actor?: string; actorName: string; action: string; entity: string; entityId?: string; entityLabel?: string; diff?: string; createdAt: string }[]>(rows),
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
