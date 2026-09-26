import type { NextAuthConfig } from "next-auth";

// Edge-safe config. Route protection (signed-in and admin-only paths) is in
// middleware.ts so there is a single list to maintain.
export default {
  providers: [],
} satisfies NextAuthConfig;
