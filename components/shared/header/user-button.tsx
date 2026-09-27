import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SignOut } from "@/actions/user.action";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";
import { isAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";

// Desktop: icon + "Hello, …" / "Account & Orders". Compact: icon only.
export default async function UserButton({ compact = false }: { compact?: boolean }) {
  const raw = await auth();
  // A failed session lookup can return an object without user.
  const session = raw?.user ? raw : null;
  const t = await getTranslations("Header");
  const name = session?.user?.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Account")}
        className={cn(
          "flex items-center rounded-md text-start text-foreground transition-colors duration-fast hover:bg-sunken data-[state=open]:bg-sunken",
          compact ? "size-11 justify-center" : "h-12 gap-2.5 px-3"
        )}
      >
        <CircleUserRound className={compact ? "size-[22px]" : "size-[22px]"} strokeWidth={1.8} />
        {!compact && (
          <>
            <span className="flex flex-col leading-tight">
              <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                {name ? t("Hello name", { name: name.split(" ")[0] }) : t("Hello sign in")}
              </span>
              <span className="text-sm font-bold">{t("Account & Orders")}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>

      {session ? (
        <DropdownMenuContent className="w-[260px]" align="end">
          <DropdownMenuLabel className="mb-1 flex flex-col border-b border-border-soft px-2.5 pb-2.5 pt-2">
            <span className="truncate font-bold">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {session.user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/account">{t("Your account")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/orders">{t("Your orders")}</Link>
            </DropdownMenuItem>
            {isAdmin(session.user.role) && (
              <DropdownMenuItem asChild>
                <Link href="/admin/overview" className="justify-between">
                  {t("Admin")}
                  <Badge variant="ink" size="sm">
                    admin
                  </Badge>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <form action={SignOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full font-semibold text-destructive">
                <LogOut aria-hidden />
                {t("Sign out")}
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      ) : (
        <DropdownMenuContent className="w-[260px] p-3" align="end">
          <Link href="/sign-in" className={cn(buttonVariants(), "w-full")}>
            {t("Sign in")}
          </Link>
          <p className="mt-3 text-center text-[13px] text-foreground-secondary">
            {t.rich("New customer start here", {
              link: (chunks) => (
                <Link href="/sign-up" className="font-bold text-foreground underline-offset-4 hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
