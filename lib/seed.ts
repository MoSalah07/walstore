/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { Model, Types } from "mongoose";

import connectToDatabase from "./connect.db";
import { calcPrices, DEFAULT_PRICING, ShippingMethod } from "./pricing";
import { products } from "@/constants/data";
import Activity from "@/models/activity.model";
import Counter from "@/models/counter.model";
import Order, { OrderStatus, PaymentMethod } from "@/models/order.model";
import Product from "@/models/product.model";
import PromoCode from "@/models/promo-code.model";
import Review, { ReviewStatus } from "@/models/review.model";
import Settings from "@/models/settings.model";
import Subscriber from "@/models/subscriber.model";
import Token from "@/models/token.model";
import Upload from "@/models/upload.model";
import User from "@/models/user.model";

// Full reset: wipes every store collection and fills it with demo data
// (products, users, ~6 months of orders, reviews, settings, subscribers, activity,
// promo codes).

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// Seeded PRNG so every run produces the same store.
let state = 20250527;
const rand = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const daysAgo = (d: number) => new Date(NOW - d * DAY - int(0, 20 * 60) * 60 * 1000);
const after = (date: Date, minDays: number, maxDays: number) =>
  new Date(Math.min(NOW - 60 * 60 * 1000, date.getTime() + (minDays + rand() * (maxDays - minDays)) * DAY));

// Builds documents through the model (defaults, casting, validation) but inserts
// them raw, so the backdated createdAt / updatedAt values are kept.
async function insertRaw<T = { _id: Types.ObjectId }>(model: Model<any>, docs: Record<string, unknown>[]) {
  const built = docs.map((d) => new model(d));
  await Promise.all(built.map((d) => d.validate()));
  const plain = built.map((d) => d.toObject({ depopulate: true }));
  if (plain.length) await model.collection.insertMany(plain);
  return plain as T[];
}

const CITIES = [
  { city: "Nasr City", province: "Cairo", postalCode: "11765" },
  { city: "Maadi", province: "Cairo", postalCode: "11728" },
  { city: "Heliopolis", province: "Cairo", postalCode: "11757" },
  { city: "Dokki", province: "Giza", postalCode: "12611" },
  { city: "6th of October", province: "Giza", postalCode: "12573" },
  { city: "Smouha", province: "Alexandria", postalCode: "21648" },
  { city: "Mansoura", province: "Dakahlia", postalCode: "35511" },
  { city: "Tanta", province: "Gharbia", postalCode: "31511" },
];
const STREETS = ["Abbas El Akkad St", "Makram Ebeid St", "Road 9", "El Tahrir St", "Mostafa El Nahas St", "El Horreya Rd", "Gamal Abdel Nasser St"];

const demoUsers = [
  { name: "Admin", email: "admin@example.com", role: "admin", password: "123456", joined: 200 },
  { name: "Sara Admin", email: "sara@walstore.com", role: "admin", password: "123456", joined: 180 },
  { name: "John Doe", email: "john@me.com", role: "user", password: "Password123", joined: 175 },
  { name: "Mohamed Salah", email: "mohamed@example.com", role: "user", password: "Password123", joined: 170 },
  { name: "Nour Hassan", email: "nour@example.com", role: "user", password: "Password123", joined: 160 },
  { name: "Ahmed Kamal", email: "ahmed@example.com", role: "user", password: "Password123", joined: 150 },
  { name: "Mariam Adel", email: "mariam@example.com", role: "user", password: "Password123", joined: 140 },
  { name: "Omar Farouk", email: "omar@example.com", role: "user", password: "Password123", joined: 120 },
  { name: "Yasmin Tarek", email: "yasmin@example.com", role: "user", password: "Password123", joined: 100 },
  { name: "Karim Mostafa", email: "karim@example.com", role: "user", password: "Password123", joined: 85 },
  { name: "Hana Ibrahim", email: "hana@example.com", role: "user", password: "Password123", joined: 60 },
  { name: "Youssef Nabil", email: "youssef@example.com", role: "user", password: "Password123", joined: 40 },
  { name: "Laila Samir", email: "laila@example.com", role: "user", password: "Password123", joined: 20 },
  { name: "Tamer Aziz", email: "tamer@example.com", role: "user", password: "Password123", joined: 95, inactive: true },
];

const REVIEW_TEXT: Record<number, { title: string; body: string }[]> = {
  5: [
    { title: "Excellent quality", body: "Fits perfectly and the material feels premium. Arrived earlier than expected." },
    { title: "Love it", body: "Exactly like the photos. I already ordered a second one in another color." },
    { title: "ممتاز جداً", body: "الخامة ممتازة والمقاس مظبوط، والتوصيل كان سريع. أنصح بيه." },
    { title: "Worth every penny", body: "Great value for the price. Washed it a few times and it still looks new." },
  ],
  4: [
    { title: "Very good", body: "Good quality overall. Runs slightly large, so consider a size down." },
    { title: "حلو بس المقاس واسع شوية", body: "المنتج كويس والخامة حلوة، بس المقاس أوسع من المعتاد." },
    { title: "Happy with it", body: "Nice product and packaging. Shipping took a couple of extra days." },
  ],
  3: [
    { title: "It's okay", body: "Decent for the price, but the color is a bit different from the pictures." },
    { title: "متوسط", body: "مش وحش بس كنت متوقع خامة أحسن من كده." },
  ],
  2: [{ title: "Not great", body: "The stitching came loose after two weeks of use." }],
  1: [{ title: "Disappointed", body: "Wrong size arrived and the return took too long." }],
};
const REPLIES = [
  "Thank you for your feedback! We're glad you like it.",
  "شكراً لتقييمك! يسعدنا إن المنتج عجبك.",
  "Sorry about that — our team will reach out to help with an exchange.",
];

async function seed() {
  try {
    await connectToDatabase();

    const all: Model<any>[] = [Product, User, Order, Review, Settings, Subscriber, Activity, Counter, Upload, PromoCode, Token];
    await Promise.all(all.map((m) => m.deleteMany({})));
    await Promise.all(all.map((m) => m.createIndexes()));
    console.log("✓ cleared collections");

    // ---------- Settings ----------
    await Settings.create({
      _id: "store",
      storeName: "WalStore",
      supportEmail: "support@walstore.com",
      supportPhone: "+20 100 000 0000",
      freeShippingMin: DEFAULT_PRICING.freeShippingMin,
      standardShipping: DEFAULT_PRICING.standard,
      expressShipping: DEFAULT_PRICING.express,
      taxRate: DEFAULT_PRICING.taxRate,
    });

    // ---------- Products ----------
    const catalog = await insertRaw<{
      _id: Types.ObjectId; name: string; slug: string; images: string[]; category: string;
      price: number; listPrice: number; sizes: string[]; colors: string[];
    }>(
      Product,
      products.map((p, i) => {
        const createdAt = daysAgo(210 - i * 3);
        return { ...p, brand: p.brand.trim(), createdAt, updatedAt: createdAt };
      })
    );
    console.log(`✓ ${catalog.length} products`);

    // ---------- Users ----------
    const hashes = new Map<string, string>();
    for (const pw of new Set(demoUsers.map((u) => u.password))) hashes.set(pw, await bcrypt.hash(pw, 10));
    const users = await insertRaw<{
      _id: Types.ObjectId; name: string; email: string; role: string; isActive: boolean; createdAt: Date;
      addresses: { fullName: string; phone: string; street: string; city: string; province: string; postalCode: string; country: string }[];
    }>(
      User,
      demoUsers.map((u) => {
        const loc = pick(CITIES);
        const createdAt = daysAgo(u.joined);
        return {
          name: u.name,
          email: u.email,
          role: u.role,
          password: hashes.get(u.password),
          isActive: !u.inactive,
          emailVerified: true,
          lastLoginAt: daysAgo(int(0, Math.min(30, u.joined))),
          addresses:
            u.role === "user"
              ? [{
                  fullName: u.name,
                  phone: `+20 1${int(0, 2)}${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
                  street: `${int(1, 120)} ${pick(STREETS)}`,
                  ...loc,
                  country: "EG",
                  isDefault: true,
                }]
              : [],
          createdAt,
          updatedAt: createdAt,
        };
      })
    );
    const admins = users.filter((u) => u.role === "admin");
    const customers = users.filter((u) => u.role === "user");
    console.log(`✓ ${users.length} users`);

    // ---------- Orders ----------
    type ActivityRow = Record<string, unknown> & { createdAt: Date };
    const activity: ActivityRow[] = [];
    const log = (actor: { _id: Types.ObjectId; name: string } | null, action: string, entity: string, at: Date, extra: Record<string, unknown> = {}) =>
      activity.push({ actor: actor?._id, actorName: actor?.name ?? "System", action, entity, createdAt: at, ...extra });

    const sold = new Map<string, number>();
    const purchases: { user: (typeof customers)[number]; productId: Types.ObjectId; at: Date }[] = [];
    const orders: Record<string, unknown>[] = [];
    let seq = 10000;

    // ~6 months of history plus a busy last week; oldest first so order numbers grow with dates.
    const orderDays = [
      ...Array.from({ length: 56 }, () => int(8, 180)),
      ...Array.from({ length: 14 }, () => int(0, 7)),
    ].sort((a, b) => b - a);
    for (const age of orderDays) {
      // Deactivated accounts (30 days ago) stop ordering.
      const eligible = customers.filter((c) => NOW - c.createdAt.getTime() > age * DAY && (c.isActive || age > 30));
      const user = pick(eligible.length ? eligible : customers);
      const createdAt = daysAgo(age);

      const lines = new Map<string, Record<string, unknown> & { price: number; quantity: number }>();
      for (let n = int(1, 3); n > 0; n--) {
        const p = pick(catalog);
        const key = String(p._id);
        const existing = lines.get(key);
        if (existing) { existing.quantity += 1; continue; }
        lines.set(key, {
          product: p._id, name: p.name, slug: p.slug, image: p.images[0], category: p.category, price: p.price,
          quantity: rand() < 0.8 ? 1 : 2,
          size: p.sizes.length ? pick(p.sizes) : undefined,
          color: p.colors.length ? pick(p.colors) : undefined,
        });
      }
      const items = [...lines.values()];
      const shippingMethod: ShippingMethod = rand() < 0.25 ? "express" : "standard";
      const paymentMethod: PaymentMethod = "cod";
      const prices = calcPrices(items, shippingMethod);

      // Older orders have moved further through the pipeline.
      let status: OrderStatus;
      const r = rand();
      if (r < 0.08) status = "cancelled";
      else if (age > 7) status = "delivered";
      else if (age > 4) status = r < 0.5 ? "shipped" : "delivered";
      else if (age > 1) status = r < 0.5 ? "processing" : "shipped";
      else status = "processing";

      const admin = pick(admins);
      const history: Record<string, unknown>[] = [{ status: "processing", at: createdAt }];
      const order: Record<string, unknown> = {
        orderNumber: `WS-${++seq}`, user: user._id, items, shippingAddress: user.addresses[0],
        shippingMethod, paymentMethod, ...prices, status, isPaid: false, history, createdAt,
      };
      delete order.freeShipping; delete order.remainingForFree; delete order.progress;
      const label = `#${order.orderNumber}`;
      log(user, "placed order", "order", createdAt, { entityLabel: label });

      let last = createdAt;
      if (status === "cancelled") {
        last = after(createdAt, 0.1, 1);
        const byAdmin = rand() < 0.5;
        order.cancelledAt = last;
        history.push({ status: "cancelled", at: last, by: byAdmin ? admin._id : user._id });
        log(byAdmin ? admin : user, "cancelled order", "order", last, { entityLabel: label, diff: "status: processing → cancelled" });
      } else {
        if (status === "shipped" || status === "delivered") {
          last = order.shippedAt = after(createdAt, 0.5, 2);
          history.push({ status: "shipped", at: last, by: admin._id });
          log(admin, "marked as shipped", "order", last, { entityLabel: label, diff: "status: processing → shipped" });
        }
        if (status === "delivered") {
          last = order.deliveredAt = order.paidAt = after(last, 1, shippingMethod === "express" ? 2 : 4);
          order.isPaid = true;
          history.push({ status: "delivered", at: last, by: admin._id });
          log(admin, "marked as delivered", "order", last, { entityLabel: label, diff: "status: shipped → delivered" });
          for (const i of items) purchases.push({ user, productId: i.product as Types.ObjectId, at: last });
        }
        for (const i of items) sold.set(String(i.product), (sold.get(String(i.product)) ?? 0) + i.quantity);
      }
      order.updatedAt = last;
      orders.push(order);
    }
    const orderDocs = await insertRaw<{ _id: Types.ObjectId; orderNumber: string }>(Order, orders);
    // Order ids are only known after building, so attach them to the log rows now.
    const idByNumber = new Map(orderDocs.map((o) => [`#${o.orderNumber}`, String(o._id)]));
    for (const a of activity) if (a.entity === "order") a.entityId = idByNumber.get(a.entityLabel as string);
    await Counter.create({ _id: "order", seq });
    await Promise.all(
      [...sold].map(([id, qty]) =>
        Product.updateOne({ _id: id }, { $inc: { numSales: qty } })
      )
    );
    console.log(`✓ ${orders.length} orders (WS-10001 → WS-${seq})`);

    // ---------- Reviews ----------
    const reviewed = new Set<string>();
    const reviews: Record<string, unknown>[] = [];
    const drafts: { buy: (typeof purchases)[number]; createdAt: Date }[] = [];
    for (const buy of purchases) {
      const key = `${buy.productId}:${buy.user._id}`;
      if (reviewed.has(key) || rand() < 0.35) continue;
      reviewed.add(key);
      drafts.push({ buy, createdAt: after(buy.at, 1, 10) });
    }
    // The newest few wait in the admin moderation queue.
    drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const [idx, { buy, createdAt }] of drafts.entries()) {
      const rating = pick([5, 5, 5, 4, 4, 4, 3, 2, 1]);
      const text = pick(REVIEW_TEXT[rating]);
      const status: ReviewStatus =
        idx >= drafts.length - 6 ? "pending" : rating <= 1 && rand() < 0.5 ? "rejected" : "approved";
      const productName = catalog.find((p) => String(p._id) === String(buy.productId))!.name;
      const review: Record<string, unknown> = {
        product: buy.productId, user: buy.user._id, userName: buy.user.name, rating, ...text,
        status, verifiedPurchase: true, createdAt, updatedAt: createdAt,
      };
      log(buy.user, "wrote a review of", "review", createdAt, { entityLabel: productName, _review: review });
      if (status !== "pending") {
        const admin = pick(admins);
        const at = after(createdAt, 0.2, 2);
        Object.assign(review, { moderatedBy: admin._id, moderatedAt: at, updatedAt: at });
        if (status === "approved" && rand() < 0.3) review.reply = rating >= 4 ? pick(REPLIES.slice(0, 2)) : REPLIES[2];
        log(admin, status === "approved" ? "approved a review of" : "rejected a review of", "review", at, {
          entityLabel: productName, diff: `rating: ${rating}★`, _review: review,
        });
      }
      reviews.push(review);
    }
    const reviewDocs = await insertRaw(Review, reviews);
    reviewDocs.forEach((d, i) => { reviews[i]._id = d._id; });
    for (const a of activity) {
      if (a._review) { a.entityId = String((a._review as { _id: Types.ObjectId })._id); delete a._review; }
    }

    // Same aggregation as recomputeRating in actions/review.action.ts.
    const ratings = await Review.aggregate<{ _id: Types.ObjectId; avg: number; n: number }>([
      { $match: { status: "approved" } },
      { $group: { _id: "$product", avg: { $avg: "$rating" }, n: { $sum: 1 } } },
    ]);
    await Promise.all(
      ratings.map((r) => Product.updateOne({ _id: r._id }, { $set: { avgRating: Math.round(r.avg * 10) / 10, numReviews: r.n } }))
    );
    console.log(`✓ ${reviews.length} reviews`);

    // ---------- Admin actions on the catalog and users ----------
    const [admin, admin2] = admins;
    for (const p of catalog.slice(0, 6)) {
      log(pick(admins), "updated product", "product", daysAgo(int(5, 60)), {
        entityId: String(p._id), entityLabel: p.name, diff: `countInStock: ${int(0, 5)} → ${int(20, 40)}`,
      });
    }
    const onSale = catalog.find((p) => p.listPrice > 0)!;
    log(admin, "changed the price of", "product", daysAgo(14), {
      entityId: String(onSale._id), entityLabel: onSale.name, diff: `price: $${onSale.listPrice} → $${onSale.price}`,
    });
    const inactive = users.find((u) => u.email === "tamer@example.com")!;
    log(admin, "deactivated", "user", daysAgo(30), { entityId: String(inactive._id), entityLabel: inactive.name });
    log(admin, "changed the role of", "user", daysAgo(178), { entityId: String(admin2._id), entityLabel: admin2.name, diff: "role: user → admin" });
    log(admin, "updated store settings", "settings", daysAgo(190), { diff: "supportEmail: — → support@walstore.com · supportPhone: — → +20 100 000 0000" });

    await insertRaw(Activity, activity);
    console.log(`✓ ${activity.length} activity entries`);

    // ---------- Newsletter ----------
    const subscribers = [
      ...customers.slice(0, 6).map((c) => c.email),
      "fatma.ali@gmail.com", "khaled.m@yahoo.com", "dina.r@outlook.com", "hossam@gmail.com",
      "reem.s@gmail.com", "amr.fathy@hotmail.com", "salma@example.org", "ziad@example.org",
    ];
    await insertRaw(
      Subscriber,
      subscribers.map((email, i) => {
        const createdAt = daysAgo(int(1, 170));
        return { email, locale: i % 3 === 0 ? "ar" : "en", createdAt, updatedAt: createdAt };
      })
    );
    console.log(`✓ ${subscribers.length} subscribers`);

    // ---------- Promo codes ----------
    // Fixed dates (no PRNG) so the data above stays the same run to run.
    const inDays = (d: number) => new Date(NOW + d * DAY);
    const promos = [
      { code: "WELCOME10", description: "First order, 10% off", kind: "percent", value: 10, maxDiscount: 50, perUserLimit: 1 },
      { code: "SAVE20", description: "$20 off orders from $150", kind: "fixed", value: 20, minOrder: 150, perUserLimit: 0 },
      { code: "VIP25", description: "25% off for 100 uses", kind: "percent", value: 25, maxDiscount: 100, usageLimit: 100, perUserLimit: 1, endsAt: inDays(30) },
      { code: "SUMMER15", description: "Summer sale, starts soon", kind: "percent", value: 15, startsAt: inDays(10), endsAt: inDays(40) },
      { code: "RAMADAN30", description: "Last campaign, ended", kind: "percent", value: 30, maxDiscount: 80, startsAt: inDays(-60), endsAt: inDays(-30) },
      { code: "STAFF50", description: "Paused", kind: "percent", value: 50, isActive: false },
    ];
    await PromoCode.create(promos);
    console.log(`✓ ${promos.length} promo codes (try WELCOME10 or SAVE20 at checkout)`);

    console.log("\nDone. Sign in with admin@example.com / 123456 or john@me.com / Password123");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
