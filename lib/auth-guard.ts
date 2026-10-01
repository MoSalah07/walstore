import "server-only";
import { cookies } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { isAdmin } from "@/lib/roles";

// Signed out, but still holding a session cookie the account no longer
// accepts: clear it first, or middleware sends the visitor straight back.
async function toSignIn(locale: string, callbackPath?: string) {
  const href = callbackPath
    ? `/sign-in?callbackUrl=${encodeURIComponent(`/${locale}${callbackPath}`)}`
    : "/sign-in";
  const stale = (await cookies()).getAll().some((c) => /authjs\.session-token/.test(c.name));
  if (stale) nextRedirect(`/api/session/clear?next=${encodeURIComponent(`/${locale}${href}`)}`);
  redirect({ href, locale });
}

// Page-level checks that back up middleware.ts.
export async function requireUser(callbackPath: string) {
  const session = await auth();
  if (!session?.user?.id) await toSignIn(await getLocale(), callbackPath);
  return session!;
}

export async function requireAdmin() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user?.id) await toSignIn(locale);
  if (!isAdmin(session!.user.role)) redirect({ href: "/not-allowed", locale });
  return session!;
}
