import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token(\.\d+)?$/;

// A session cookie can outlive its account's permission to use it (password
// reset, deactivation, deletion). Middleware can't see that, so it keeps
// treating the visitor as signed in and pages bounce them back and forth.
// Pages send such visitors here: the stale cookie is dropped, then on to
// `next`. A valid session is never touched, so this can't sign anyone out.
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(safe, req.url));
  const session = await auth();
  if (!session?.user?.id) {
    for (const c of req.cookies.getAll()) {
      if (SESSION_COOKIE.test(c.name)) res.cookies.delete(c.name);
    }
  }
  return res;
}
