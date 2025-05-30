import { WEBSITE_NAME } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Logo({ classname }: { classname?: string }) {
  return (
    <Link
      href={`/`}
      className={`flex-center gap-2 hover:bg-black/50 hover:cursor-pointer hover-effect p-2 rounded-md ${classname}`}
    >
      <Image
        src={`/images/logo.svg`}
        alt="logo"
        width={42}
        height={42}
        priority
        className="object-cover object-center"
      />
      <span className="text-white font-bold text-sm tracking-wider">
        {WEBSITE_NAME}
      </span>
    </Link>
  );
}
