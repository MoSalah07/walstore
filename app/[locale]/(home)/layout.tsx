import React from "react";

import Footer from "@/components/shared/footer/Footer";
import Header from "@/components/shared/header/Header";
import MobileTabBar from "@/components/shared/mobile-tab-bar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
