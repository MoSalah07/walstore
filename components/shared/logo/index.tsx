import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Logo() {
  return (
    <Link
      href={`/`}
      className="transition-colors duration-300 hover:bg-black/80 size-14 flex items-center justify-center rounded-full hover:cursor-pointer border border-transparent hover:border-blue-500"
    >
      <Image
        src={`/images/logo.svg`}
        alt="logo"
        width={42}
        height={42}
        priority
        className="object-cover object-center"
      />
    </Link>
  );
}
