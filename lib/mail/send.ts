import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { headers } from "next/headers";

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

// Sends through Resend when RESEND_API_KEY is set. Without it (local work,
// or before the key is added) the email is printed to the server console
// instead, links included, so every flow can still be followed end to end.
// Never throws: a failed email must not fail the order or sign-up behind it.
export async function sendEmail(email: Email): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const file = await savePreview(email);
    console.info(
      [
        "",
        "┌─ email (not sent: RESEND_API_KEY is not set) ─────────────",
        `│ to:      ${email.to}`,
        `│ subject: ${email.subject}`,
        ...(file ? [`│ preview: ${file}`] : []),
        "│",
        ...email.text.split("\n").map((l) => `│ ${l}`),
        "└────────────────────────────────────────────────────────────",
      ].join("\n")
    );
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "WalStore <onboarding@resend.dev>",
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("sendEmail", res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("sendEmail", err);
    return { ok: false };
  }
}

// The HTML version, saved so it can be opened in a browser.
async function savePreview(email: Email) {
  try {
    const dir = join(tmpdir(), "walstore-emails");
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${email.subject.replace(/[^\w-]+/g, "-").slice(0, 40)}.html`);
    await writeFile(file, email.html, "utf8");
    return file;
  } catch {
    return null;
  }
}

// Absolute links for emails: APP_URL when set (production), otherwise the
// host of the current request.
export async function appUrl() {
  const fixed = process.env.APP_URL?.replace(/\/+$/, "");
  if (fixed) return fixed;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  } catch {
    // Outside a request.
  }
  return "http://localhost:3000";
}
