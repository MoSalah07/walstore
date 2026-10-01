"use server";

import bcrypt from "bcryptjs";
import { after } from "next/server";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import { auth } from "@/auth";
import { PasswordSchema } from "@/interfaces/validator/validator";
import { logActivity } from "@/lib/activity";
import connectToDatabase from "@/lib/connect.db";
import { sendAccountLink } from "@/lib/mail/notify";
import { appUrl } from "@/lib/mail/send";
import { consumeToken, issueToken } from "@/lib/tokens";
import User from "@/models/user.model";

// ---------- Forgot / reset password ----------

// Always answers the same way, so the form can't be used to find out which
// emails have an account.
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: "invalid" }> {
  const parsed = z.string().trim().toLowerCase().email().max(200).safeParse(email);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectToDatabase();
  const user = await User.findOne({ email: parsed.data }).select("name email isActive password").lean();
  if (user && user.isActive !== false && user.password) {
    const token = await issueToken(user._id, user.email, "reset-password");
    if (token) {
      const [baseUrl, locale] = await Promise.all([appUrl(), getLocale()]);
      after(() => sendAccountLink("reset-password", { name: user.name, email: user.email }, token, baseUrl, locale));
    }
  }
  return { ok: true };
}

const ResetSchema = z
  .object({ token: z.string().min(1).max(100), password: PasswordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"] });

export async function resetPassword(input: { token: string; password: string; confirmPassword: string }): Promise<{ ok: boolean; error?: "invalid" | "expired" }> {
  const parsed = ResetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectToDatabase();
  const token = await consumeToken(parsed.data.token, "reset-password");
  if (!token) return { ok: false, error: "expired" };
  const user = await User.findById(token.user);
  if (!user || user.isActive === false) return { ok: false, error: "expired" };
  user.password = await bcrypt.hash(parsed.data.password, 10);
  user.passwordChangedAt = new Date();
  // Opening the link proves they own the address it was sent to.
  if (token.email === user.email) user.emailVerified = true;
  await user.save();
  await logActivity({
    actor: { id: String(user._id), name: user.name },
    action: "reset their password",
    entity: "user",
    entityId: String(user._id),
    entityLabel: user.email,
  });
  return { ok: true };
}

// ---------- Email verification ----------

export async function resendVerificationEmail(): Promise<{ ok: boolean; error?: "auth" | "verified" | "wait" }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "auth" };
  await connectToDatabase();
  const user = await User.findById(session.user.id).select("name email emailVerified").lean();
  if (!user) return { ok: false, error: "auth" };
  if (user.emailVerified) return { ok: false, error: "verified" };
  const token = await issueToken(user._id, user.email, "verify-email");
  if (!token) return { ok: false, error: "wait" };
  const [baseUrl, locale] = await Promise.all([appUrl(), getLocale()]);
  after(() => sendAccountLink("verify-email", { name: user.name, email: user.email }, token, baseUrl, locale));
  return { ok: true };
}
