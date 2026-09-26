import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Route protection lives here only (auth.config.ts no longer duplicates it).
const SIGNED_IN_ONLY = /^\/(checkout|account|admin)(\/|$)/;
const ADMIN_ONLY = /^\/admin(\/|$)/;
const GUEST_ONLY = /^\/(sign-in|sign-up)(\/|$)/;

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api")) return NextResponse.next();

  const parts = pathname.split("/").filter(Boolean);
  const hasLocale = routing.locales.includes(parts[0]);
  const locale = hasLocale ? parts[0] : routing.defaultLocale;
  // Path without the locale prefix, e.g. "/admin/orders".
  const path = "/" + (hasLocale ? parts.slice(1) : parts).join("/");

  const userAgent = req.headers.get("user-agent") ?? "";
  if (/bot/i.test(userAgent) && !path.startsWith("/not-allowed")) {
    return NextResponse.redirect(new URL(`/${locale}/not-allowed`, req.url));
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });

  if (!token && SIGNED_IN_ONLY.test(path)) {
    const url = new URL(`/${locale}/sign-in`, req.url);
    url.searchParams.set("callbackUrl", `/${locale}${path}${search}`);
    return NextResponse.redirect(url);
  }

  if (token && ADMIN_ONLY.test(path) && String(token.role).toLowerCase() !== "admin") {
    return NextResponse.redirect(new URL(`/${locale}/not-allowed`, req.url));
  }

  if (token && GUEST_ONLY.test(path)) {
    const next = req.nextUrl.searchParams.get("callbackUrl");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}`;
    return NextResponse.redirect(new URL(safe, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
