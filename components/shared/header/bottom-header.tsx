"use client";
import { BOTTOM_MENU } from "@/constants/currency";
import { useTranslations } from "next-intl";
import Link from "next/link";
import React from "react";
import Container from "../container";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function BottomHeader() {
  const t = useTranslations("Header");

  return (
    <nav className="h-[30%] w-full bg-blue-800 ">
      <Container className="flex items-center justify-between">
        {/* DESKTOP */}
        <div className="h-full w-full hidden sm:flex-center gap-4">
          {BOTTOM_MENU.map((item, idx) => (
            <Link
              key={idx}
              href={`#`}
              className="hover-effect hover:underline hover:text-white/65 text-white"
            >
              {t(item)}
            </Link>
          ))}
        </div>
        {/* MOBILE */}
        <div className="h-[30%] flex-1 flex items-center justify-between sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant={"secondary"} size={"icon"}>
                {" "}
                {t("All")}
              </Button>
            </SheetTrigger>
            <SheetContent side={"top"}>
              <SheetTitle></SheetTitle>
              <SheetDescription></SheetDescription>
              <div className="flex flex-col mt-6 gap-y-2">
                {BOTTOM_MENU.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`#`}
                    className="hover-effect hover:underline hover:text-blue-800"
                  >
                    {t(item)}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </nav>
  );
}
