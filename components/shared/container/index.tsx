import React from "react";
import { cn } from "@/lib/utils";

interface IProps {
  children: React.ReactNode;
  className?: string;
}

// 1280px content with 16 / 32 / 80px side gutters (see tailwind `container`).
export default function Container({ children, className }: IProps) {
  return <div className={cn("container w-full", className)}>{children}</div>;
}
