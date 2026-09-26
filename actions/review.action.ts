"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import connectToDatabase from "@/lib/connect.db";
import { isAdmin } from "@/lib/roles";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import Review, { ReviewStatus } from "@/models/review.model";

const toJSON = <T,>(x: unknown) => JSON.parse(JSON.stringify(x)) as T;

export type ReviewDTO = {
  _id: string;
  product: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  reply?: string;
  createdAt: string;
};

// Approved reviews for the product page, newest first.
export async function getProductReviews(productId: string, limit = 20): Promise<ReviewDTO[]> {
  if (!Types.ObjectId.isValid(productId)) return [];
  await connectToDatabase();
  const rows = await Review.find({ product: productId, status: "approved" }).sort({ createdAt: -1 }).limit(limit).lean();
  return toJSON<ReviewDTO[]>(rows);
}

// Can the signed-in customer review this product, and have they already?
export async function getReviewEligibility(productId: string) {
  const session = await auth();
  if (!session?.user?.id || !Types.ObjectId.isValid(productId)) return { signedIn: false, purchased: false, existing: null as ReviewDTO | null };
  await connectToDatabase();
  const [purchased, existing] = await Promise.all([
    Order.exists({ user: session.user.id, status: "delivered", "items.product": productId }),
    Review.findOne({ product: productId, user: session.user.id }).lean(),
  ]);
  return { signedIn: true, purchased: !!purchased, existing: existing ? toJSON<ReviewDTO>(existing) : null };
}

const ReviewSchema = z.object({
  productId: z.string().regex(/^[0-9a-f]{24}$/i),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10).max(2000),
});

// Customers who received the product may review it once; it waits for approval.
export async function submitReview(input: z.infer<typeof ReviewSchema>): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  const parsed = ReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectToDatabase();
  const bought = await Order.exists({ user: session.user.id, status: "delivered", "items.product": parsed.data.productId });
  if (!bought) return { ok: false, error: "not-purchased" };
  const product = await Product.findById(parsed.data.productId).select("name").lean<{ name: string }>();
  if (!product) return { ok: false, error: "invalid" };
  try {
    const review = await Review.create({
      product: parsed.data.productId,
      user: session.user.id,
      userName: session.user.name ?? "Customer",
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      verifiedPurchase: true,
    });
    await logActivity({ actor: session.user, action: "wrote a review of", entity: "review", entityId: String(review._id), entityLabel: product.name });
    return { ok: true };
  } catch {
    return { ok: false, error: "duplicate" };
  }
}

// ---------- Admin ----------

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) throw new Error("Forbidden");
  await connectToDatabase();
  return session;
}

async function recomputeRating(productId: Types.ObjectId | string) {
  const [agg] = await Review.aggregate<{ avg: number; n: number }>([
    { $match: { product: new Types.ObjectId(String(productId)), status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { $set: { avgRating: agg ? Math.round(agg.avg * 10) / 10 : 0, numReviews: agg?.n ?? 0 } }
  );
}

export type AdminReview = ReviewDTO & { productName: string; productImage: string; productSlug: string };

export async function getAdminReviews(status: ReviewStatus = "pending") {
  await assertAdmin();
  const [rows, counts] = await Promise.all([
    Review.find({ status }).sort({ createdAt: -1 }).limit(100).populate("product", "name images slug").lean(),
    Review.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const c: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  counts.forEach((x) => (c[x._id] = x.n));
  return {
    reviews: rows.map((r) => {
      const p = r.product as unknown as { _id: Types.ObjectId; name: string; images: string[]; slug: string } | null;
      return {
        ...toJSON<ReviewDTO>({ ...r, product: p?._id ?? r.product }),
        productName: p?.name ?? "—",
        productImage: p?.images?.[0] ?? "",
        productSlug: p?.slug ?? "",
      };
    }) as AdminReview[],
    counts: c,
  };
}

export async function moderateReview(id: string, status: "approved" | "rejected", reply?: string): Promise<{ ok: boolean }> {
  const session = await assertAdmin();
  const r = await Review.findByIdAndUpdate(
    id,
    { $set: { status, reply: reply?.trim() || undefined, moderatedBy: session.user.id, moderatedAt: new Date() } },
    { new: true }
  ).populate("product", "name");
  if (!r) return { ok: false };
  const productId = (r.product as unknown as { _id: Types.ObjectId })._id;
  await recomputeRating(productId);
  await logActivity({
    actor: session.user,
    action: status === "approved" ? "approved a review of" : "rejected a review of",
    entity: "review",
    entityId: id,
    entityLabel: (r.product as unknown as { name: string }).name,
    diff: `rating: ${r.rating}★`,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getPendingReviewCount() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) return 0;
  await connectToDatabase();
  return Review.countDocuments({ status: "pending" });
}
