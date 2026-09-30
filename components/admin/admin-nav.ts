import {
  Activity,
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  Star,
  Tag,
  TicketPercent,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { key: string; href: string; icon: LucideIcon; badge?: "toShip" | "reviews" };

// Sidebar groups; labels live under messages Admin.nav.*.
export const ADMIN_NAV: { group: string | null; items: AdminNavItem[] }[] = [
  { group: null, items: [{ key: "overview", href: "/admin/overview", icon: LayoutDashboard }] },
  {
    group: "store",
    items: [
      { key: "orders", href: "/admin/orders", icon: Package, badge: "toShip" },
      { key: "products", href: "/admin/products", icon: Tag },
      { key: "reviews", href: "/admin/reviews", icon: Star, badge: "reviews" },
      { key: "promo", href: "/admin/promo-codes", icon: TicketPercent },
    ],
  },
  {
    group: "people",
    items: [
      { key: "users", href: "/admin/users", icon: Users },
      { key: "roles", href: "/admin/roles", icon: UserCog },
    ],
  },
  {
    group: "system",
    items: [
      { key: "settings", href: "/admin/settings", icon: SlidersHorizontal },
      { key: "activity", href: "/admin/activity", icon: Activity },
    ],
  },
];

export const activeKey = (pathname: string) =>
  ADMIN_NAV.flatMap((g) => g.items).find((i) => pathname.startsWith(i.href))?.key ?? "overview";
