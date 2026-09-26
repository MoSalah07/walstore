"use server";
import { z } from "zod";
import { getLocale } from "next-intl/server";

import connectToDatabase from "@/lib/connect.db";
import Subscriber from "@/models/subscriber.model";

const Email = z.string().trim().email();

// Home page "Get Today's Deals in your inbox". Idempotent per email.
export async function subscribeToNewsletter(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const parsed = Email.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    await connectToDatabase();
    await Subscriber.updateOne(
      { email: parsed.data.toLowerCase() },
      { $setOnInsert: { email: parsed.data.toLowerCase(), locale: await getLocale() } },
      { upsert: true }
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
