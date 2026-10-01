import "server-only";

import connectToDatabase from "@/lib/connect.db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { sendEmail } from "./send";
import { OrderEmailKind, accountEmail, orderEmail } from "./templates";

// Called from after() so the customer never waits on the email provider.
export async function notifyOrder(kind: OrderEmailKind, orderId: string, baseUrl: string) {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId).lean();
    if (!order) return;
    const user = await User.findById(order.user).select("name email").lean();
    if (!user?.email) return;
    await sendEmail(await orderEmail(kind, order, { name: user.name, email: user.email }, baseUrl));
  } catch (err) {
    console.error("notifyOrder", kind, orderId, err);
  }
}

export async function sendAccountLink(
  kind: "reset-password" | "verify-email",
  user: { name: string; email: string },
  token: string,
  baseUrl: string,
  locale: string
) {
  try {
    const path = kind === "reset-password" ? "reset-password" : "verify-email";
    const link = `${baseUrl}/${locale}/${path}?token=${encodeURIComponent(token)}`;
    await sendEmail(await accountEmail(kind, user, link, locale));
  } catch (err) {
    console.error("sendAccountLink", kind, err);
  }
}
