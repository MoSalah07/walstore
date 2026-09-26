"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-base ease-standard data-[state=checked]:bg-primary data-[state=unchecked]:bg-input disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-base ease-standard data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-[18px] dark:data-[state=checked]:bg-inverse" />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
