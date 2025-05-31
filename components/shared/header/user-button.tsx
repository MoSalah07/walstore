import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

export default async function UserButton() {
  const session = await auth();
  const t = await getTranslations();
  return (
    <div className="text-white w-fit border border-white py-1 px-2 rounded-md">
      <DropdownMenu>
        <DropdownMenuTrigger className="border-none outline-none focus:outline-none focus:border-none">
          {" "}
          <div className="flex items-center">
            <div className="flex flex-col text-xs text-left">
              <span>
                {t("Header.Hello")},{" "}
                {session ? session.user.name : t("Header.sign in")}
              </span>
              <span className="font-bold">{t("Header.Account & Orders")}</span>
            </div>
            <ChevronDownIcon />
          </div>
        </DropdownMenuTrigger>
        {session ? null : (
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  className={cn(buttonVariants(), "w-full")}
                  href="/sign-in"
                >
                  {t("Header.Sign in")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="font-normal">
                {t("Header.New Customer")}?{" "}
                <Link href="/sign-up">{t("Header.Sign up")}</Link>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
