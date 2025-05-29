import Footer from "@/components/shared/footer/Footer";
import Header from "@/components/shared/header/Header";
import React from "react";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col dark:bg-gray-950">{children}</main>
      <Footer />
    </div>
  );
}
