import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const publicRoutes = ["/api"]; // قائمة الروابط التي لا تحتاج إلى لغة

// إنشاء `next-intl` middleware
const intlMiddleware = createIntlMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
});
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const locales = routing.locales;
  const pathnameParts = pathname.split("/").filter(Boolean);
  const locale = locales.includes(pathnameParts[0])
    ? pathnameParts[0]
    : routing.defaultLocale;

  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (publicRoutes.some((route) => pathname.startsWith(route)))
    return NextResponse.next();

  const userAgent = req.headers.get("user-agent");
  if (userAgent?.includes("bot")) {
    return NextResponse.redirect(new URL(`/${locale}/not-allowed`, req.url));
  }

  const secret_Key = process.env.NEXTAUTH_SECRET;
  const session = await getToken({ req, secret: secret_Key });

  const protectedRoutes = [
    "/profile",
    "/my-appointments",
    "/verify",
    "/api/dashboard",
  ];

  if (!session && protectedRoutes.some((route) => pathname.includes(route))) {
    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  if (
    session &&
    (pathname === `/${locale}/sign-in` || pathname === `/${locale}/sign-up`)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  return intlMiddleware(req);
}
export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)", // استثناء الملفات الثابتة
    "/sign-in",
    "/sign-up",
  ],
};
