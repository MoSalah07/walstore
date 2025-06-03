import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDirection } from "@/i18n/i18n-confige";
import { Menu } from "lucide-react";

import SwitcherMode from "./SwitcherMode";
import MainSwitcher from "./main-switcher";
import ShoppingCart from "./shopping-cart";
import UserButton from "./user-button";
import { getTranslations, getLocale } from "next-intl/server";

export default async function MenuDesktop() {
  const locale = await getLocale();
  const dir = getDirection(locale);
  const t = await getTranslations("Header");

  return (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant={"secondary"} size={"icon"}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={dir === "ltr" ? "right" : "left"}
        dir={dir === "ltr" ? "ltr" : "rtl"}
        className="bg-primary-color dark:bg-black [&>button]:text-white"
      >
        <SheetHeader>
          <SheetTitle className="text-white">{t("Menu")}</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        {/* Menus */}
        <div className="flex flex-col justify-center gap-y-4">
          <SwitcherMode />
          <MainSwitcher />
          <UserButton />
          <ShoppingCart />
        </div>
      </SheetContent>
    </Sheet>
  );
}
