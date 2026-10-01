"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import type { OrderDTO } from "@/actions/order.action";
import { logActivity } from "@/lib/activity";
import { notifyOrder } from "@/lib/mail/notify";
import { appUrl } from "@/lib/mail/send";
import { releasePromo } from "@/lib/promo";
import connectToDatabase from "@/lib/connect.db";
import { isAdmin } from "@/lib/roles";
import Activity from "@/models/activity.model";
import Order, { OrderStatus } from "@/models/order.model";
import Product from "@/models/product.model";
import Review from "@/models/review.model";
import User from "@/models/user.model";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) throw new Error("Forbidden");
  await connectToDatabase();
  return session;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toJSON = <T,>(x: unknown) => JSON.parse(JSON.stringify(x)) as T;

export type AdminOrderRow = OrderDTO & { customer: { name: string; email: string } | null };

const PERIODS: Record<string, number | null> = { today: 1, "7d": 7, "30d": 30, all: null };

function since(period: string) {
  const days = PERIODS[period] ?? 30;
  if (days === null) return null;
  const d = new Date();
  if (days === 1) d.setHours(0, 0, 0, 0);
  else d.setDate(d.getDate() - days);
  return d;
}

export async function getAdminOrders({
  status = "all",
  q,
  period = "30d",
  payment = "all",
  page = 1,
  limit = 10,
}: {
  status?: string;
  q?: string;
  period?: string;
  payment?: string;
  page?: number;
  limit?: number;
}) {
  await assertAdmin();
  const base: Record<string, unknown> = {};
  const from = since(period);
  if (from) base.createdAt = { $gte: from };
  if (payment !== "all") base.paymentMethod = payment;
  if (q) {
    const rx = { $regex: escape(q.replace(/^#/, "")), $options: "i" };
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id").lean();
    base.$or = [{ orderNumber: rx }, { "shippingAddress.fullName": rx }, { user: { $in: users.map((u) => u._id) } }];
  }
  const filter = status === "all" ? base : { ...base, status };

  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email").lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  const byStatus: Record<string, number> = { all: 0 };
  counts.forEach((c) => {
    byStatus[c._id] = c.n;
    byStatus.all += c.n;
  });

  return {
    orders: orders.map((o) => {
      const u = o.user as unknown as { _id: Types.ObjectId; name: string; email: string } | null;
      return {
        ...toJSON<OrderDTO>({ ...o, user: u?._id ?? o.user }),
        customer: u ? { name: u.name, email: u.email } : null,
      };
    }) as AdminOrderRow[],
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts: byStatus,
  };
}

export async function getAdminOrder(id: string) {
  await assertAdmin();
  if (!Types.ObjectId.isValid(id)) return null;
  const order = await Order.findById(id).populate("user", "name email createdAt").lean();
  if (!order) return null;
  const u = order.user as unknown as { _id: Types.ObjectId; name: string; email: string; createdAt: Date } | null;
  const orderCount = u ? await Order.countDocuments({ user: u._id }) : 0;
  return {
    order: toJSON<OrderDTO>({ ...order, user: u?._id ?? order.user }),
    customer: u ? toJSON<{ _id: string; name: string; email: string; createdAt: string }>(u) : null,
    orderCount,
  };
}

// processing → shipped → delivered; cancel from unpaid/processing/shipped.
const NEXT: Record<string, OrderStatus[]> = {
  unpaid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function setOrderStatus(id: string, status: OrderStatus): Promise<{ ok: boolean; error?: string }> {
  const session = await assertAdmin();
  const order = await Order.findById(id);
  if (!order) return { ok: false, error: "missing" };
  if (!NEXT[order.status]?.includes(status)) return { ok: false, error: "transition" };
  const from = order.status;
  const now = new Date();
  order.status = status;
  if (status === "shipped") order.shippedAt = now;
  if (status === "delivered") {
    order.deliveredAt = now;
    // Cash on delivery is collected at the door.
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = now;
    }
  }
  if (status === "cancelled") order.cancelledAt = now;
  order.history.push({ status, at: now, by: new Types.ObjectId(session.user.id) });
  await order.save();
  if (status === "cancelled") {
    await Promise.all([
      ...order.items.map((i) =>
        Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.quantity, numSales: -i.quantity } })
      ),
      releasePromo(order.promo?.code),
    ]);
  }
  await logActivity({
    actor: session.user,
    action: status === "cancelled" ? "cancelled order" : `marked as ${status}`,
    entity: "order",
    entityId: id,
    entityLabel: `#${order.orderNumber}`,
    diff: `status: ${from} → ${status}`,
  });
  // The customer hears about the steps they wait for; "processing" is internal.
  if (status === "shipped" || status === "delivered" || status === "cancelled") {
    const baseUrl = await appUrl();
    after(() => notifyOrder(status, id, baseUrl));
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function markOrderPaid(id: string): Promise<{ ok: boolean }> {
  const session = await assertAdmin();
  const order = await Order.findById(id);
  if (!order || order.isPaid || order.status === "cancelled") return { ok: false };
  const now = new Date();
  order.isPaid = true;
  order.paidAt = now;
  // A paid "unpaid" order moves on to processing.
  if (order.status === "unpaid") order.status = "processing";
  order.history.push({ status: "paid", at: now, by: new Types.ObjectId(session.user.id) });
  await order.save();
  await logActivity({ actor: session.user, action: "marked as paid", entity: "order", entityId: id, entityLabel: `#${order.orderNumber}` });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function addOrderNote(id: string, note: string): Promise<{ ok: boolean }> {
  const session = await assertAdmin();
  const text = note.trim().slice(0, 500);
  if (!text) return { ok: false };
  const order = await Order.findByIdAndUpdate(
    id,
    { $push: { history: { status: "note", at: new Date(), by: session.user.id, note: text } } },
    { new: true }
  );
  if (!order) return { ok: false };
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

// Bulk "Mark as shipped" from the orders table.
export async function shipOrders(ids: string[]): Promise<{ ok: boolean; count: number }> {
  let count = 0;
  for (const id of ids.slice(0, 100)) {
    const r = await setOrderStatus(id, "shipped");
    if (r.ok) count++;
  }
  return { ok: true, count };
}

// ---------- Overview ----------

export async function getDashboard(period = "30d") {
  const session = await assertAdmin();
  const from = since(period);
  const days = PERIODS[period] ?? 30;
  const prevFrom = from && days ? new Date(from.getTime() - days * 86400000) : null;
  const live = { status: { $ne: "cancelled" } };

  const sum = async (match: Record<string, unknown>) => {
    const [r] = await Order.aggregate<{ revenue: number; orders: number; units: number }>([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 }, units: { $sum: { $sum: "$items.quantity" } } } },
    ]);
    return r ?? { revenue: 0, orders: 0, units: 0 };
  };

  const cur = await sum(from ? { ...live, createdAt: { $gte: from } } : live);
  const prev = prevFrom && from ? await sum({ ...live, createdAt: { $gte: prevFrom, $lt: from } }) : null;

  // Daily revenue for the last 14 days (chart).
  // Days are bucketed in UTC on both the database and the series side.
  const chartFrom = new Date();
  chartFrom.setUTCHours(0, 0, 0, 0);
  chartFrom.setUTCDate(chartFrom.getUTCDate() - 13);
  const daily = await Order.aggregate<{ _id: string; revenue: number }>([
    { $match: { ...live, createdAt: { $gte: chartFrom } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" } } },
  ]);
  const byDay = new Map(daily.map((d) => [d._id, d.revenue]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(chartFrom.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, revenue: Math.round((byDay.get(key) ?? 0) * 100) / 100 };
  });

  const [toShip, unpaid, lowStock, reviewsPending, recent, activity, categories, top] = await Promise.all([
    Order.countDocuments({ status: "processing" }),
    Order.countDocuments({ status: "unpaid" }),
    Product.countDocuments({ isPublished: true, countInStock: { $lte: 15 } }),
    Review.countDocuments({ status: "pending" }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name").lean(),
    Activity.find().sort({ createdAt: -1 }).limit(6).lean(),
    Product.aggregate<{ _id: string; units: number }>([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", units: { $sum: "$numSales" } } },
      { $sort: { units: -1 } },
    ]),
    Product.find({ isPublished: true }).sort({ numSales: -1 }).limit(4).select("name images numSales slug").lean(),
  ]);

  return {
    adminName: session.user.name ?? "",
    kpis: {
      revenue: cur.revenue,
      orders: cur.orders,
      aov: cur.orders ? cur.revenue / cur.orders : 0,
      units: cur.units,
      prev: prev ? { revenue: prev.revenue, orders: prev.orders, aov: prev.orders ? prev.revenue / prev.orders : 0, units: prev.units } : null,
    },
    series,
    attention: { toShip, unpaid, lowStock, reviews: reviewsPending },
    recent: recent.map((o) => ({
      _id: String(o._id),
      orderNumber: o.orderNumber,
      customer: (o.user as unknown as { name?: string } | null)?.name ?? o.shippingAddress.fullName,
      status: o.status,
      total: o.totalPrice,
      createdAt: o.createdAt.toISOString(),
    })),
    activity: toJSON<{ _id: string; actorName: string; action: string; entityLabel?: string; createdAt: string }[]>(activity),
    categories: categories.map((c) => ({ name: c._id, units: c.units })),
    top: toJSON<{ _id: string; name: string; images: string[]; numSales: number; slug: string }[]>(top),
  };
}

export async function getAdminBadgeCounts() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) return { toShip: 0, lowStock: 0, reviews: 0 };
  await connectToDatabase();
  const [toShip, lowStock, reviews] = await Promise.all([
    Order.countDocuments({ status: "processing" }),
    Product.countDocuments({ isPublished: true, countInStock: { $lte: 15 } }),
    Review.countDocuments({ status: "pending" }),
  ]);
  return { toShip, lowStock, reviews };
}
