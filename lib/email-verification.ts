import "server-only";
import { after } from "next/server";
import { getLocale } from "next-intl/server";

import connectToDatabase from "@/lib/connect.db";
import { sendAccountLink } from "@/lib/mail/notify";
import { appUrl } from "@/lib/mail/send";
import { consumeToken, issueToken } from "@/lib/tokens";
import Token from "@/models/token.model";
import User from "@/models/user.model";

// Not server actions on purpose: they take a user from the caller.

// Called right after sign-up.
export async function sendWelcomeVerification(user: { _id: unknown; name: string; email: string }) {
  const token = await issueToken(String(user._id), user.email, "verify-email");
  if (!token) return;
  const [baseUrl, locale] = await Promise.all([appUrl(), getLocale()]);
  after(() => sendAccountLink("verify-email", { name: user.name, email: user.email }, token, baseUrl, locale));
}

// The /verify-email page. A used link comes back "expired"; the page then
// checks whether the signed-in account is already confirmed.
export async function verifyEmailToken(token: string): Promise<"verified" | "expired"> {
  await connectToDatabase();
  const t = await consumeToken(token, "verify-email");
  if (!t) return "expired";
  const res = await User.updateOne({ _id: t.user, email: t.email }, { $set: { emailVerified: true } });
  if (res.matchedCount !== 1) return "expired"; // the address changed since the link was sent
  await Token.deleteMany({ user: t.user, kind: "verify-email" });
  return "verified";
}
