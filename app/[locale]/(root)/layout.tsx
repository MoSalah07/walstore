import Footer from "@/components/shared/footer/Footer";
import Header from "@/components/shared/header/Header";
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      <main className="min-h-screen dark:bg-gray-950">{children}</main>
      <Footer />
    </div>
  );
}
