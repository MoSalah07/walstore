import React from "react";
import Logo from "../logo";
import Container from "../container";
import Search from "./Search";
import SwitcherMode from "./SwitcherMode";
import ShoppingCart from "./shopping-cart";
import MainSwitcher from "./main-switcher";
import MenuDesktop from "./menu-desktop";

export default function TopHeader() {
  return (
    <div className="h-[70%] bg-blue-700 ">
      <Container className="flex items-center justify-between">
        <Logo />
        <Search />
        <div className="hidden md:flex items-center gap-6">
          <SwitcherMode />
          <MainSwitcher />
          <ShoppingCart />
        </div>
        <MenuDesktop />
      </Container>
    </div>
  );
}
