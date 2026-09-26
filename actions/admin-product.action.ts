"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { auth } from "@/auth";
import { ProductInputSchema } from "@/interfaces/validator/validator";
import { logActivity } from "@/lib/activity";
import connectToDatabase from "@/lib/connect.db";
import { isAdmin } from "@/lib/roles";
import { round2, toSlug } from "@/lib/utils";
import { LOW_STOCK } from "@/constants";
import Product from "@/models/product.model";
import type { IProduct } from "@/interfaces/product.interface";
import Upload from "@/models/upload.model";

export type ProductInput = z.infer<typeof ProductInputSchema>;
export type AdminProduct = ProductInput & {
  _id: string;
  numSales: number;
  avgRating?: number;
  numReviews?: number;
  createdAt: string;
  updatedAt: string;
};

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) throw new Error("Forbidden");
  await connectToDatabase();
  return session;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toJSON = <T,>(x: unknown) => JSON.parse(JSON.stringify(x)) as T;

export async function getAdminProducts({
  q,
  category = "all",
  stock = "all",
  page = 1,
  limit = 10,
}: { q?: string; category?: string; stock?: string; page?: number; limit?: number }) {
  await assertAdmin();
  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = { $regex: escape(q), $options: "i" };
    filter.$or = [{ name: rx }, { brand: rx }, { slug: rx }];
  }
  if (category !== "all") filter.category = category;
  if (stock === "low") filter.countInStock = { $lte: LOW_STOCK };
  if (stock === "out") filter.countInStock = 0;
  if (stock === "draft") filter.isPublished = false;

  const [products, total, categories, totalAll, low] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
    Product.distinct("category"),
    Product.countDocuments({}),
    Product.countDocuments({ countInStock: { $lte: LOW_STOCK } }),
  ]);
  return {
    products: toJSON<AdminProduct[]>(products),
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    categories: (categories as string[]).sort(),
    stats: { total: totalAll, categories: categories.length, low },
  };
}

export async function getAdminProduct(id: string) {
  await assertAdmin();
  if (!Types.ObjectId.isValid(id)) return null;
  const p = await Product.findById(id).lean();
  return p ? toJSON<AdminProduct>(p) : null;
}

export async function getProductCategories() {
  await assertAdmin();
  return ((await Product.distinct("category")) as string[]).sort();
}

type SaveResult = { ok: true; id: string } | { ok: false; error: "invalid" | "slug" | "missing"; fields?: Record<string, string[]> };

const money = (n: number) => `$${n.toFixed(2)}`;

// Creates (no id) or updates a product. Records what changed in the activity log.
export async function saveProduct(input: ProductInput, id?: string): Promise<SaveResult> {
  const session = await assertAdmin();
  const parsed = ProductInputSchema.safeParse({ ...input, slug: input.slug || toSlug(input.name) });
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  const data = { ...parsed.data, price: round2(parsed.data.price), listPrice: round2(parsed.data.listPrice) };

  const clash = await Product.exists({ slug: data.slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (clash) return { ok: false, error: "slug" };

  if (!id) {
    const created = await Product.create({ ...data, numSales: 0 });
    await logActivity({ actor: session.user, action: "created product", entity: "product", entityId: String(created._id), entityLabel: created.name });
    revalidatePath("/", "layout");
    return { ok: true, id: String(created._id) };
  }

  const before = await Product.findById(id).lean<IProduct>();
  if (!before) return { ok: false, error: "missing" };
  await Product.updateOne({ _id: id }, { $set: data });

  const diff: string[] = [];
  if (before.price !== data.price) diff.push(`price: ${money(before.price)} → ${money(data.price)}`);
  if (before.listPrice !== data.listPrice) diff.push(`listPrice: ${money(before.listPrice)} → ${money(data.listPrice)}`);
  if (before.countInStock !== data.countInStock) diff.push(`countInStock: ${before.countInStock} → ${data.countInStock}`);
  if (before.isPublished !== data.isPublished) diff.push(`published: ${before.isPublished} → ${data.isPublished}`);
  if (before.name !== data.name) diff.push("name changed");
  await logActivity({
    actor: session.user,
    action: diff.some((d) => d.startsWith("price")) ? "changed the price of" : "updated product",
    entity: "product",
    entityId: id,
    entityLabel: data.name,
    diff: diff.join(" · ") || undefined,
  });
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function setProductPublished(id: string, isPublished: boolean): Promise<{ ok: boolean }> {
  const session = await assertAdmin();
  const p = await Product.findByIdAndUpdate(id, { $set: { isPublished } }, { new: true });
  if (!p) return { ok: false };
  await logActivity({
    actor: session.user,
    action: isPublished ? "published" : "unpublished",
    entity: "product",
    entityId: id,
    entityLabel: p.name,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<{ ok: boolean }> {
  const session = await assertAdmin();
  const p = await Product.findByIdAndDelete(id);
  if (!p) return { ok: false };
  // Past orders keep their own copy of name, image and price.
  await logActivity({ actor: session.user, action: "deleted product", entity: "product", entityId: id, entityLabel: p.name });
  revalidatePath("/", "layout");
  return { ok: true };
}

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Stores an image in the database and returns its URL.
export async function uploadProductImage(
  form: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: "type" | "size" | "missing" }> {
  const session = await assertAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "missing" };
  if (!TYPES.includes(file.type)) return { ok: false, error: "type" };
  if (file.size > MAX_BYTES) return { ok: false, error: "size" };
  const buf = Buffer.from(await file.arrayBuffer());
  const doc = await Upload.create({ data: buf, contentType: file.type, size: buf.length, name: file.name.slice(0, 120), uploadedBy: session.user.id });
  return { ok: true, url: `/api/images/${doc._id}` };
}
