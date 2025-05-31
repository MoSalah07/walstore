import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center min-h-screen highlight-link  ">
      <main className="w-full h-screen">
        <div className=" bg-gradient-to-r from-blue-800 to-blue-500  w-full h-full ">
          {children}
        </div>
      </main>
    </div>
  );
}
