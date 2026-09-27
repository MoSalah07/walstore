"use client";

import { useEffect, useState } from "react";
import { Bell, ExternalLink, LogOut, Menu, PanelLeft, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { SignOut } from "@/actions/user.action";
import LocaleCurrencyMenu from "@/components/shared/header/locale-currency-menu";
import { LogoMark } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, activeKey } from "./admin-nav";

type Counts = { toShip: number; lowStock: number; reviews: number };

function NavLinks({ collapsed, counts, onNavigate }: { collapsed: boolean; counts: Counts; onNavigate?: () => void }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const active = activeKey(pathname);
  return (
    <>
      {ADMIN_NAV.map((g, gi) => (
        <div key={gi} className="mb-3.5 flex flex-col gap-0.5">
          {g.group && !collapsed && (
            <span className="flex h-6 items-center px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {t(`group.${g.group}`)}
            </span>
          )}
          {g.items.map(({ key, href, icon: Icon, badge }) => {
            const on = key === active;
            const n = badge ? counts[badge] : 0;
            const link = (
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={on ? "page" : undefined}
                aria-label={collapsed ? t(`nav.${key}`) : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm text-primary-hover transition-colors duration-fast dark:text-foreground-secondary",
                  collapsed && "justify-center",
                  on ? "bg-secondary font-bold dark:text-foreground" : "font-medium hover:bg-background-subtle"
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                {!collapsed && <span className="flex-1 truncate">{t(`nav.${key}`)}</span>}
                {n > 0 &&
                  (collapsed ? (
                    <span className="absolute end-2 top-1.5 size-2 rounded-full bg-deal" aria-hidden />
                  ) : (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-deal px-1.5 text-[11px] font-bold text-white dark:text-[#0B0D12]">
                      {n}
                    </span>
                  ))}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={key}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{t(`nav.${key}`)}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={key}>{link}</div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function Sidebar({ collapsed, counts, user }: { collapsed: boolean; counts: Counts; user: { name: string; role: string } }) {
  const t = useTranslations("Admin");
  return (
    <nav
      aria-label={t("Admin")}
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-e print:!hidden border-border bg-card py-5 transition-[width] duration-slow ease-standard md:flex",
        collapsed ? "w-[72px] px-3" : "w-[248px] px-4"
      )}
    >
      <Link href="/admin/overview" className={cn("mb-5 flex h-10 items-center gap-2.5 px-2", collapsed && "justify-center")}>
        <LogoMark size="sm" className="size-8" />
        {!collapsed && (
          <>
            <span dir="ltr" className="font-display text-[21px] font-extrabold tracking-[-0.03em]">
              walstore
            </span>
            <span className="ms-auto whitespace-nowrap rounded-[6px] bg-sunken px-2 py-0.5 text-[11px] font-bold text-foreground-secondary">
              {t("Admin")}
            </span>
          </>
        )}
      </Link>
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <NavLinks collapsed={collapsed} counts={counts} />
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className={cn(
            "flex h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm font-medium text-foreground-secondary hover:bg-background-subtle",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? t("View store") : undefined}
        >
          <ExternalLink className="size-[18px]" aria-hidden />
          {!collapsed && t("View store")}
        </Link>
        <div className={cn("flex items-center gap-2.5 rounded-md border border-border p-2.5", collapsed && "justify-center p-1.5")}>
          <Avatar name={user.name} size="sm" />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-bold">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </span>
              <form action={SignOut}>
                <button type="submit" aria-label={t("Sign out")} className="flex size-8 items-center justify-center rounded-sm text-foreground-secondary hover:bg-sunken">
                  <LogOut className="size-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AdminSearch({ className }: { className?: string }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [q, setQ] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("adm-q")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/admin/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className={cn(
        "flex h-[38px] items-center gap-2 rounded-[10px] border border-border bg-background-subtle pe-2.5 ps-3 text-sm text-muted-foreground focus-within:border-foreground",
        className
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <label htmlFor="adm-q" className="sr-only">
        {t("Search admin")}
      </label>
      <input
        id="adm-q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("Search placeholder")}
        className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
      />
      <kbd className="hidden rounded-[5px] border border-input bg-card px-1.5 py-px font-mono text-[11px] font-semibold text-foreground-secondary lg:inline">
        Ctrl K
      </kbd>
    </form>
  );
}

function Notifications({ counts }: { counts: Counts }) {
  const t = useTranslations("Admin");
  const total = [counts.toShip, counts.lowStock, counts.reviews].filter((n) => n > 0).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Notifications", { count: total })}
        className="relative flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border border-border bg-card text-primary-hover hover:border-foreground dark:text-foreground"
      >
        <Bell className="size-4" />
        {total > 0 && <span className="absolute end-2 top-[7px] size-2 rounded-full bg-deal ring-2 ring-card" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">{t("Needs attention")}</DropdownMenuLabel>
        {total === 0 && <p className="px-2.5 py-3 text-sm text-foreground-secondary">{t("All caught up")}</p>}
        {counts.toShip > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/admin/orders?status=processing">{t("orders to ship", { count: counts.toShip })}</Link>
          </DropdownMenuItem>
        )}
        {counts.lowStock > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/admin/products?stock=low">{t("low stock", { count: counts.lowStock })}</Link>
          </DropdownMenuItem>
        )}
        {counts.reviews > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/admin/reviews">{t("reviews waiting", { count: counts.reviews })}</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminShell({
  children,
  counts,
  user,
}: {
  children: React.ReactNode;
  counts: Counts;
  user: { name: string; role: string };
}) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const active = activeKey(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Remember the choice; tablets start collapsed.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin-sidebar");
      if (saved) setCollapsed(saved === "collapsed");
      else setCollapsed(window.matchMedia("(max-width: 1279px)").matches);
    } catch {
      setCollapsed(window.matchMedia("(max-width: 1279px)").matches);
    }
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("admin-sidebar", c ? "expanded" : "collapsed");
      } catch {}
      return !c;
    });

  const tabs = [
    { key: "overview", href: "/admin/overview" },
    { key: "orders", href: "/admin/orders" },
    { key: "products", href: "/admin/products" },
    { key: "users", href: "/admin/users" },
  ];
  const tabIcon = Object.fromEntries(ADMIN_NAV.flatMap((g) => g.items).map((i) => [i.key, i.icon]));

  return (
    <div className="flex min-h-dvh bg-background-subtle">
      <Sidebar collapsed={collapsed} counts={counts} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex print:hidden h-[60px] items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:h-16 md:gap-4 md:px-6 xl:px-8">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
            aria-expanded={!collapsed}
            className="hidden size-9 items-center justify-center rounded-sm border border-border text-foreground-secondary hover:border-foreground md:flex"
          >
            <PanelLeft className="size-4 rtl:-scale-x-100" />
          </button>
          <LogoMark size="sm" className="md:hidden" />
          <nav aria-label={t("Breadcrumb")} className="flex min-w-0 items-center gap-2 text-sm text-foreground-secondary">
            <Link href="/admin/overview" className="hidden hover:text-foreground md:inline">
              {t("Admin")}
            </Link>
            <span aria-hidden className="hidden text-muted-foreground md:inline">
              /
            </span>
            <span className="truncate font-bold text-foreground md:font-semibold">{t(`nav.${active}`)}</span>
          </nav>
          <AdminSearch className="ms-auto hidden w-80 sm:flex" />
          <div className="ms-auto flex items-center gap-2 sm:ms-0">
            <Link href="/admin/search" aria-label={t("Search admin")} className="flex size-[38px] items-center justify-center rounded-[10px] border border-border sm:hidden">
              <Search className="size-4" />
            </Link>
            <Notifications counts={counts} />
            <div className="hidden rounded-[10px] border border-border px-1.5 md:block [&_button]:!text-foreground">
              <LocaleCurrencyMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10 md:pt-6 xl:px-8 xl:pt-8">{children}</main>
      </div>

      {/* Phones: Overview · Orders · Products · Users · More */}
      <nav
        aria-label={t("Admin")}
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(68px+env(safe-area-inset-bottom))] grid-cols-5 print:hidden border-t border-border bg-card px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        {tabs.map(({ key, href }) => {
          const Icon = tabIcon[key];
          const on = active === key;
          return (
            <Link
              key={key}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn("relative flex flex-col items-center justify-center gap-1 text-[11px]", on ? "font-bold text-foreground" : "font-semibold text-foreground-secondary")}
            >
              <Icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
              {t(`nav.${key}`)}
              {key === "orders" && counts.toShip > 0 && <span className="absolute end-[calc(50%-18px)] top-0.5 size-2 rounded-full bg-deal" />}
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button type="button" className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-foreground-secondary">
              <Menu className="size-[22px]" strokeWidth={1.8} aria-hidden />
              {t("More")}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" closeLabel={t("Close")}>
            <SheetHeader>
              <SheetTitle>{t("Admin")}</SheetTitle>
              <SheetDescription className="sr-only">{t("More")}</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto">
              <NavLinks collapsed={false} counts={counts} onNavigate={() => setMoreOpen(false)} />
              <Link href="/" className="flex h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm font-medium text-foreground-secondary">
                <ExternalLink className="size-[18px]" aria-hidden />
                {t("View store")}
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
