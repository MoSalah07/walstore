"use server";

import { Types } from "mongoose";
import { z } from "zod";

import { auth } from "@/auth";
import { CheckoutSchema } from "@/interfaces/validator/validator";
import connectToDatabase from "@/lib/connect.db";
import { calcPrices, PromoRule } from "@/lib/pricing";
import { logActivity } from "@/lib/activity";
import { isAdmin } from "@/lib/roles";
import { checkPromo, PromoError, releasePromo, reservePromo } from "@/lib/promo";
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
  | { ok: false; error: "auth" | "invalid" | "stock" | "unavailable" | "server"; detail?: string }
  | { ok: false; error: "promo"; detail: PromoError; minOrder?: number };

export type PromoCodeResult =
  | { ok: true; code: string; rule: PromoRule }
  | { ok: false; error: PromoError | "auth" | "invalid"; minOrder?: number };

const PromoCheckSchema = z.object({
  code: z.string().trim().min(1).max(40),
  items: CheckoutSchema.shape.items,
});

// Checkout "Apply" button. The subtotal comes from database prices; the code
// is checked again when the order is placed.
export async function applyPromoCode(input: z.infer<typeof PromoCheckSchema>): Promise<PromoCodeResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  const parsed = PromoCheckSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectToDatabase();
  const ids = [...new Set(parsed.data.items.map((i) => i.product))];
  const products = await Product.find({ _id: { $in: ids }, isPublished: true }).select("price").lean();
  const price = new Map(products.map((p) => [String(p._id), p.price]));
  const itemsPrice = parsed.data.items.reduce((a, i) => a + (price.get(i.product) ?? 0) * i.quantity, 0);
  const res = await checkPromo(parsed.data.code, session.user.id, itemsPrice);
  if (!res.ok) return res;
  return { ok: true, code: res.promo.code, rule: res.rule };
}

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

    const promoCheck = data.promoCode
      ? await checkPromo(
          data.promoCode,
          session.user.id,
          lines.reduce((a, l) => a + l.price * l.quantity, 0)
        )
      : null;
    if (promoCheck && !promoCheck.ok) {
      return { ok: false, error: "promo", detail: promoCheck.error, minOrder: promoCheck.minOrder };
    }

    // Reserve stock line by line; undo on the first shortfall.
    const reserved: { id: Types.ObjectId; qty: number }[] = [];
    const unreserve = () =>
      Promise.all(
        reserved.map((r) =>
          Product.updateOne({ _id: r.id }, { $inc: { countInStock: r.qty, numSales: -r.qty } })
        )
      );
    for (const l of lines) {
      const res = await Product.updateOne(
        { _id: l.product, countInStock: { $gte: l.quantity } },
        { $inc: { countInStock: -l.quantity, numSales: l.quantity } }
      );
      if (res.modifiedCount !== 1) {
        await unreserve();
        return { ok: false, error: "stock", detail: l.name };
      }
      reserved.push({ id: l.product as Types.ObjectId, qty: l.quantity });
    }

    // The last use of a limited code may have gone while we checked stock.
    const promo = promoCheck?.ok ? promoCheck.promo : null;
    if (promo && !(await reservePromo(promo._id))) {
      await unreserve();
      return { ok: false, error: "promo", detail: "used-up" };
    }

    const prices = calcPrices(lines, data.shippingMethod, await getPricingConfig(), promoCheck?.ok ? promoCheck.rule : null);
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
      discountPrice: prices.discountPrice,
      promo: promo ? { code: promo.code, kind: promo.kind, value: promo.value } : undefined,
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

    await logActivity({
      actor: session.user,
      action: "placed order",
      entity: "order",
      entityId: String(order._id),
      entityLabel: `#${order.orderNumber}`,
    });
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
  await logActivity({
    actor: session.user,
    action: "cancelled order",
    entity: "order",
    entityId: String(order._id),
    entityLabel: `#${order.orderNumber}`,
    diff: "status: processing → cancelled",
  });
  await Promise.all([
    ...order.items.map((i) =>
      Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.quantity, numSales: -i.quantity } })
    ),
    releasePromo(order.promo?.code),
  ]);
  return { ok: true };
}
