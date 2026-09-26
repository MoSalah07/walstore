"use server";

import { auth } from "@/auth";
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
