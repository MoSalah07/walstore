import React from "react";
import TopHeader from "./top-header";
import BottomHeader from "./bottom-header";

export default function Header() {
  return (
    <header className="max-sm:h-[25vh] h-[20vh] sticky z-50 inset-0 shadow-lg">
      <TopHeader />
      <BottomHeader />
    </header>
  );
}
