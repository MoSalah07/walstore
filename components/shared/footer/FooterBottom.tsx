"use client";
import { WEBSITE_NAME } from "@/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";
import React from "react";

export default function FooterBottom() {
  const t = useTranslations();
  return (
    <div className="mt-4 text-white">
      <div className="flex justify-center  gap-3 text-sm">
        <Link className="hover:underline" href="/page/conditions-of-use">
          {t("Footer.Conditions of Use")}
        </Link>
        <Link className="hover:underline" href="/page/privacy-policy">
          {t("Footer.Privacy Notice")}
        </Link>
        <Link className="hover:underline" href="/page/help">
          {t("Footer.Help")}
        </Link>
      </div>
      <div className="mt-4">
        <p className="text-center text-xs">
          {t("Footer.Copyright")} &copy; {t("Footer.Year")}{" "}
          {new Date().getFullYear()} {WEBSITE_NAME}
        </p>
        <p className="text-center text-xs mt-2 hover:underline hover:cursor-pointer">
          {t("Footer.Design by", { name: "Mohamed Salah" })}
        </p>
      </div>
    </div>
  );
}
