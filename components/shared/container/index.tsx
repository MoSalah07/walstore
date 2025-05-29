import React from "react";

interface IProps {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className }: IProps) {
  return (
    <div className={`container mx-auto px-2 h-full w-full ${className}`}>
      {children}
    </div>
  );
}
