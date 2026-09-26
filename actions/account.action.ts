"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, unstable_update } from "@/auth";
import { ShippingAddressSchema } from "@/interfaces/validator/validator";
import connectToDatabase from "@/lib/connect.db";
import User, { IUserAddress } from "@/models/user.model";

export type AccountDTO = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  addresses: (IUserAddress & { _id: string })[];
};

export async function getMyAccount(): Promise<AccountDTO | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectToDatabase();
  const u = await User.findById(session.user.id).select("-password").lean();
  if (!u) return null;
  return JSON.parse(
    JSON.stringify({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: !!u.emailVerified,
      createdAt: u.createdAt,
      addresses: u.addresses ?? [],
    })
  );
}


type Result = { ok: true } | { ok: false; error: string };

const NameSchema = z.string().trim().min(2).max(40);

export async function updateMyName(name: string): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  const parsed = NameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectToDatabase();
  await User.updateOne({ _id: session.user.id }, { $set: { name: parsed.data } });
  await unstable_update({ user: { name: parsed.data } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const PasswordChangeSchema = z.object({
  current: z.string().min(1),
  next: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/)
    .regex(/\d/),
});

export async function changeMyPassword(input: { current: string; next: string }): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  const parsed = PasswordChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "weak" };
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user?.password || !(await bcrypt.compare(parsed.data.current, user.password))) {
    return { ok: false, error: "wrong" };
  }
  user.password = await bcrypt.hash(parsed.data.next, 10);
  await user.save();
  return { ok: true };
}

// Adds a new address (no id) or updates an existing one.
export async function saveMyAddress(
  address: z.infer<typeof ShippingAddressSchema> & { _id?: string; isDefault?: boolean }
): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  const parsed = ShippingAddressSchema.safeParse(address);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "auth" };
  const makeDefault = address.isDefault || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
  const existing = address._id ? user.addresses.find((a) => String(a._id) === address._id) : undefined;
  if (existing) Object.assign(existing, parsed.data, makeDefault ? { isDefault: true } : {});
  else user.addresses.push({ ...parsed.data, isDefault: makeDefault });
  await user.save();
  revalidatePath("/account");
  return { ok: true };
}

export async function removeMyAddress(id: string): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "auth" };
  const wasDefault = user.addresses.find((a) => String(a._id) === id)?.isDefault;
  user.addresses = user.addresses.filter((a) => String(a._id) !== id);
  if (wasDefault && user.addresses[0]) user.addresses[0].isDefault = true;
  await user.save();
  revalidatePath("/account");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "auth" };
  user.addresses.forEach((a) => (a.isDefault = String(a._id) === id));
  await user.save();
  revalidatePath("/account");
  return { ok: true };
}
