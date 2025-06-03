import React from "react";
import Logo from "../logo";
import Container from "../container";
import Search from "./Search";
import SwitcherMode from "./SwitcherMode";
import ShoppingCart from "./shopping-cart";
import MainSwitcher from "./main-switcher";
import MenuDesktop from "./menu-desktop";
import UserButton from "./user-button";

export default function TopHeader() {
  return (
    // DeskTop
    <div className="h-[70%] bg-blue-700 ">
      <Container className="max-sm:hidden flex items-center justify-between">
        <Logo />
        <Search />
        {/*  */}
        <div className="hidden lg:flex items-center gap-6">
          <SwitcherMode />
          <MainSwitcher />
          <UserButton />
          <ShoppingCart />
        </div>
        <MenuDesktop />
      </Container>
      {/* Mobile */}
      <Container className="hidden max-sm:flex max-sm:flex-col gap-y-2 pb-3 h-full w-full">
        <div className="flex items-center justify-between h-full w-full">
          <Logo />
          <MenuDesktop />
        </div>
        <div>
          <Search />
        </div>
      </Container>
    </div>
  );
}
