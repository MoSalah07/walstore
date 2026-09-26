"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { auth } from "@/auth";
import { CheckoutSchema } from "@/interfaces/validator/validator";
import connectToDatabase from "@/lib/connect.db";
import { calcPrices } from "@/lib/pricing";
import { isAdmin } from "@/lib/roles";
import { getPricingConfig } from "@/lib/settings";
import { nextSequence } from "@/models/counter.model";
import Order, { IOrder } from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";

export type OrderDTO = Omit<IOrder, "_id" | "user" | "items" | "history"> & {
  _id: string;
  user: string;
  items: (Omit<IOrder["items"][number], "product"> & { product: string })[];
  history: { status: string; at: string; note?: string }[];
};

const toDTO = (o: unknown) => JSON.parse(JSON.stringify(o)) as OrderDTO;

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: "auth" | "invalid" | "stock" | "unavailable" | "server"; detail?: string };

// Places a cash-on-delivery order. Prices and stock come from the database,
// never from the client cart.
export async function createOrder(input: z.infer<typeof CheckoutSchema>): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };

  const parsed = CheckoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  try {
    await connectToDatabase();
    const ids = [...new Set(data.items.map((i) => i.product))];
    const products = await Product.find({ _id: { $in: ids }, isPublished: true }).lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const lines = [];
    for (const i of data.items) {
      const p = byId.get(i.product);
      if (!p) return { ok: false, error: "unavailable", detail: i.product };
      lines.push({
        product: p._id,
        name: p.name,
        slug: p.slug,
        image: p.images[0],
        category: p.category,
        price: p.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      });
    }

    // Reserve stock line by line; undo on the first shortfall.
    const reserved: { id: Types.ObjectId; qty: number }[] = [];
    for (const l of lines) {
      const res = await Product.updateOne(
        { _id: l.product, countInStock: { $gte: l.quantity } },
        { $inc: { countInStock: -l.quantity, numSales: l.quantity } }
      );
      if (res.modifiedCount !== 1) {
        await Promise.all(
          reserved.map((r) =>
            Product.updateOne({ _id: r.id }, { $inc: { countInStock: r.qty, numSales: -r.qty } })
          )
        );
        return { ok: false, error: "stock", detail: l.name };
      }
      reserved.push({ id: l.product as Types.ObjectId, qty: l.quantity });
    }

    const prices = calcPrices(lines, data.shippingMethod, await getPricingConfig());
    const seq = await nextSequence("order");
    const now = new Date();
    const order = await Order.create({
      orderNumber: `WS-${seq}`,
      user: session.user.id,
      items: lines,
      shippingAddress: data.shippingAddress,
      shippingMethod: data.shippingMethod,
      paymentMethod: data.paymentMethod,
      itemsPrice: prices.itemsPrice,
      shippingPrice: prices.shippingPrice,
      taxPrice: prices.taxPrice,
      totalPrice: prices.totalPrice,
      // Cash on delivery: accepted and processing, paid when delivered.
      status: "processing",
      isPaid: false,
      history: [{ status: "processing", at: now }],
    });

    if (data.saveAddress) {
      const user = await User.findById(session.user.id);
      if (user) {
        const a = data.shippingAddress;
        const exists = user.addresses?.some(
          (x) => x.street === a.street && x.city === a.city && x.postalCode === a.postalCode
        );
        if (!exists) {
          user.addresses.forEach((x) => (x.isDefault = false));
          user.addresses.push({ ...a, isDefault: true });
          await user.save();
        }
      }
    }

    return { ok: true, orderId: String(order._id) };
  } catch (err) {
    console.error("createOrder", err);
    return { ok: false, error: "server" };
  }
}

// Owner or admin only.
export async function getOrderById(id: string): Promise<OrderDTO | null> {
  const session = await auth();
  if (!session?.user?.id || !Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const order = await Order.findById(id).lean();
  if (!order) return null;
  if (String(order.user) !== session.user.id && !isAdmin(session.user.role)) return null;
  return toDTO(order);
}

export async function getMyOrders({
  page = 1,
  limit = 10,
  status,
  q,
}: { page?: number; limit?: number; status?: string; q?: string } = {}) {
  const session = await auth();
  if (!session?.user?.id) return { orders: [] as OrderDTO[], total: 0, totalPages: 0 };
  await connectToDatabase();
  const filter: Record<string, unknown> = { user: session.user.id };
  if (status && status !== "all") {
    filter.status = status === "open" ? { $in: ["unpaid", "processing", "shipped"] } : status;
  }
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ orderNumber: { $regex: safe, $options: "i" } }, { "items.name": { $regex: safe, $options: "i" } }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { orders: orders.map(toDTO), total, totalPages: Math.ceil(total / limit) };
}

export async function getMyOrderStats() {
  const session = await auth();
  if (!session?.user?.id) return { total: 0, open: 0 };
  await connectToDatabase();
  const [total, open] = await Promise.all([
    Order.countDocuments({ user: session.user.id }),
    Order.countDocuments({ user: session.user.id, status: { $in: ["unpaid", "processing", "shipped"] } }),
  ]);
  return { total, open };
}

// Customers may cancel while the order has not shipped; stock is returned.
export async function cancelMyOrder(id: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id || !Types.ObjectId.isValid(id)) return { ok: false };
  await connectToDatabase();
  const order = await Order.findOneAndUpdate(
    { _id: id, user: session.user.id, status: { $in: ["unpaid", "processing"] } },
    {
      $set: { status: "cancelled", cancelledAt: new Date() },
      $push: { history: { status: "cancelled", at: new Date(), by: session.user.id } },
    },
    { new: true }
  );
  if (!order) return { ok: false };
  await Promise.all(
    order.items.map((i) =>
      Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.quantity, numSales: -i.quantity } })
    )
  );
  return { ok: true };
}
