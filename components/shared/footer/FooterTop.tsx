import React from "react";
import Logo from "../logo";
import FooterSwitcherCurrency from "./FooterSwitcherCurrency";
import FooterSwitcherLang from "./FooterSwitcherLang";

export default function FooterTop() {
  return (
    <div className="flex-center flex-col sm:flex-row gap-2 sm:w-auto mx-auto sm:mx-0">
      <Logo classname="w-fit" />
      <FooterSwitcherLang />
      <FooterSwitcherCurrency />
    </div>
  );
}
