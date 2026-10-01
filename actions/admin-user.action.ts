"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { AdminUserSchema } from "@/interfaces/validator/validator";
import { logActivity } from "@/lib/activity";
import connectToDatabase from "@/lib/connect.db";
import { isAdmin } from "@/lib/roles";
import Activity from "@/models/activity.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) throw new Error("Forbidden");
  await connectToDatabase();
  return session;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toJSON = <T,>(x: unknown) => JSON.parse(JSON.stringify(x)) as T;

export type AdminUserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orders: number;
  spent: number;
};

export async function getAdminUsers({
  q,
  role = "all",
  verified = false,
  page = 1,
  limit = 10,
}: { q?: string; role?: string; verified?: boolean; page?: number; limit?: number }) {
  await assertAdmin();
  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = { $regex: escape(q), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (role !== "all") filter.role = role;
  if (verified) filter.emailVerified = true;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [users, total, totalAll, newThisMonth, admins] = await Promise.all([
    User.find(filter).select("-password -addresses").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    User.countDocuments({ role: "admin" }),
  ]);
  const stats = await Order.aggregate<{ _id: Types.ObjectId; orders: number; spent: number }>([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: "cancelled" } } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$totalPrice" } } },
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));
  return {
    users: users.map((u) => ({
      ...toJSON<Omit<AdminUserRow, "orders" | "spent">>(u),
      orders: byUser.get(String(u._id))?.orders ?? 0,
      spent: byUser.get(String(u._id))?.spent ?? 0,
    })) as AdminUserRow[],
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: { total: totalAll, newThisMonth, admins },
  };
}

export async function getAdminUser(id: string) {
  await assertAdmin();
  if (!Types.ObjectId.isValid(id)) return null;
  const u = await User.findById(id).select("-password").lean();
  if (!u) return null;
  const [orders, activity] = await Promise.all([
    Order.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
    Activity.find({ $or: [{ actor: id }, { entity: "user", entityId: id }] }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  const live = orders.filter((o) => o.status !== "cancelled");
  const spent = live.reduce((a, o) => a + o.totalPrice, 0);
  return {
    user: toJSON<AdminUserRow & { addresses: { fullName: string; street: string; city: string; province: string; postalCode: string; country: string; phone: string; isDefault?: boolean }[] }>(u),
    orders: toJSON<{ _id: string; orderNumber: string; createdAt: string; status: string; totalPrice: number; items: { quantity: number }[]; paymentMethod: string }[]>(orders),
    activity: toJSON<{ _id: string; actorName: string; action: string; entityLabel?: string; diff?: string; createdAt: string }[]>(activity),
    stats: { orders: live.length, spent, avg: live.length ? spent / live.length : 0 },
  };
}

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function adminCount() {
  return User.countDocuments({ role: "admin" });
}

export async function updateUser(id: string, input: { name: string; email: string; role: string }): Promise<Result> {
  const session = await assertAdmin();
  const parsed = AdminUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await User.findById(id);
  if (!user) return { ok: false, error: "missing" };
  const email = parsed.data.email.toLowerCase();
  if (email !== user.email && (await User.exists({ email }))) return { ok: false, error: "email" };
  if (user.role === "admin" && parsed.data.role !== "admin") {
    if (id === session.user.id) return { ok: false, error: "self" };
    if ((await adminCount()) <= 1) return { ok: false, error: "last-admin" };
  }
  const diff: string[] = [];
  if (user.role !== parsed.data.role) diff.push(`role: ${user.role} → ${parsed.data.role}`);
  if (user.email !== email) diff.push(`email: ${user.email} → ${email}`);
  if (user.name !== parsed.data.name) diff.push("name changed");
  user.name = parsed.data.name;
  // A new address has to be confirmed again by its owner.
  if (user.email !== email) user.emailVerified = false;
  user.email = email;
  user.role = parsed.data.role;
  await user.save();
  await logActivity({
    actor: session.user,
    action: diff.some((d) => d.startsWith("role")) ? "changed the role of" : "updated user",
    entity: "user",
    entityId: id,
    entityLabel: user.name,
    diff: diff.join(" · ") || undefined,
  });
  revalidatePath("/admin/users", "layout");
  return { ok: true };
}

export async function createUser(input: { name: string; email: string; role: string; password: string }): Promise<Result> {
  const session = await assertAdmin();
  const parsed = AdminUserSchema.safeParse(input);
  if (!parsed.success || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(input.password)) return { ok: false, error: "invalid" };
  const email = parsed.data.email.toLowerCase();
  if (await User.exists({ email })) return { ok: false, error: "email" };
  const u = await User.create({ ...parsed.data, email, password: await bcrypt.hash(input.password, 10) });
  await logActivity({ actor: session.user, action: "created user", entity: "user", entityId: String(u._id), entityLabel: u.email });
  revalidatePath("/admin/users");
  return { ok: true, id: String(u._id) };
}

export async function setUserActive(id: string, isActive: boolean): Promise<Result> {
  const session = await assertAdmin();
  if (id === session.user.id) return { ok: false, error: "self" };
  const u = await User.findByIdAndUpdate(id, { $set: { isActive } }, { new: true });
  if (!u) return { ok: false, error: "missing" };
  await logActivity({ actor: session.user, action: isActive ? "reactivated" : "deactivated", entity: "user", entityId: id, entityLabel: u.name });
  revalidatePath("/admin/users", "layout");
  return { ok: true };
}

export async function deleteUser(id: string): Promise<Result> {
  const session = await assertAdmin();
  if (id === session.user.id) return { ok: false, error: "self" };
  const user = await User.findById(id);
  if (!user) return { ok: false, error: "missing" };
  if (user.role === "admin" && (await adminCount()) <= 1) return { ok: false, error: "last-admin" };
  await user.deleteOne();
  // Orders stay in history with their own address snapshot.
  await logActivity({ actor: session.user, action: "deleted user", entity: "user", entityId: id, entityLabel: user.email });
  revalidatePath("/admin/users", "layout");
  return { ok: true };
}
