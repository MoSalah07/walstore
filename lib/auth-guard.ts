import "server-only";
import { getLocale } from "next-intl/server";

import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { isAdmin } from "@/lib/roles";

// Page-level checks that back up middleware.ts.
export async function requireUser(callbackPath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const locale = await getLocale();
    redirect({
      href: `/sign-in?callbackUrl=${encodeURIComponent(`/${locale}${callbackPath}`)}`,
      locale,
    });
  }
  return session!;
}

export async function requireAdmin() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  if (!isAdmin(session!.user.role)) redirect({ href: "/not-allowed", locale });
  return session!;
}
