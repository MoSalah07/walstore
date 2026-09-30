// What each role can do — mirrors the checks in middleware.ts, lib/auth-guard.ts
// and the admin server actions. Update this when those checks change.
export type Scope = "all" | "own" | "none";
export type PermissionRow = { key: string; user: Scope; admin: Scope };

export const PERMISSION_GROUPS: { key: "storefront" | "store" | "system"; rows: PermissionRow[] }[] = [
  {
    key: "storefront",
    rows: [
      { key: "catalog.read", user: "all", admin: "all" },
      { key: "checkout.create", user: "all", admin: "all" },
      { key: "account.self", user: "own", admin: "own" },
      { key: "reviews.write", user: "own", admin: "own" },
    ],
  },
  {
    key: "store",
    rows: [
      { key: "admin.access", user: "none", admin: "all" },
      { key: "products.write", user: "none", admin: "all" },
      { key: "products.delete", user: "none", admin: "all" },
      { key: "orders.manage", user: "own", admin: "all" },
      { key: "reviews.moderate", user: "none", admin: "all" },
      { key: "promo.manage", user: "none", admin: "all" },
    ],
  },
  {
    key: "system",
    rows: [
      { key: "users.manage", user: "none", admin: "all" },
      { key: "users.role", user: "none", admin: "all" },
      { key: "settings.manage", user: "none", admin: "all" },
      { key: "activity.read", user: "none", admin: "all" },
    ],
  },
];

export const permissionCoverage = (role: "user" | "admin") => {
  const rows = PERMISSION_GROUPS.flatMap((g) => g.rows);
  return { granted: rows.filter((r) => r[role] !== "none").length, total: rows.length };
};
