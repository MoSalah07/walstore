"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getDirection } from "@/i18n/i18n-confige";
import clsx from "clsx";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();
  const t = useTranslations("Header");
  const locale = useLocale();
  const dir = getDirection(locale);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      router.push(`/${locale}/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="max-sm:w-full w-[65%] md:w-[40%] rounded-xl h-12 relative"
    >
      <Input
        type="search"
        value={searchTerm}
        placeholder={t("Search")}
        className="focus:outline-none focus:border-white border-white outline-none h-full w-full bg-white placeholder:text-blue-600 placeholder:text-sm"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button
        aria-label="Search"
        type="submit"
        className={clsx(
          dir === "rtl" ? "left-3" : "right-3",
          `absolute top-1/2 -translate-y-1/2 
          hover-effect bg-blue-800 hover:bg-blue-950 
          cursor-pointer size-8 flex-center rounded-lg`
        )}
      >
        <SearchIcon size={23} color="white" />
      </button>
      {searchTerm.trim().length > 0 && (
        <button
          aria-label="Clear Search"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSearchTerm("");
          }}
          className={`absolute ${
            dir === "rtl" ? "left-14" : "right-14"
          } top-1/2 -translate-y-1/2`}
        >
          <X />
        </button>
      )}
    </form>
  );
}
