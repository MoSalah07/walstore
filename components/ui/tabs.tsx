"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

// `underline` for content sections, `segmented` for compact filters.
const tabsListVariants = cva("flex", {
  variants: {
    variant: {
      underline: "gap-6 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--border))] scrollbar-none",
      segmented: "inline-flex h-[38px] gap-0.5 rounded-[10px] bg-muted p-[3px]",
    },
  },
  defaultVariants: { variant: "underline" },
});

const tabsTriggerVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-sans transition-colors duration-fast disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        underline:
          "h-11 px-0 text-sm font-semibold text-foreground-secondary hover:text-foreground data-[state=active]:font-bold data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_-2px_0_rgb(var(--foreground))]",
        segmented:
          "h-8 rounded-sm px-3 text-[13px] font-semibold text-foreground-secondary hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      },
    },
    defaultVariants: { variant: "underline" },
  }
);

type Variant = VariantProps<typeof tabsListVariants>["variant"];
const TabsVariantContext = React.createContext<Variant>("underline");

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
    VariantProps<typeof tabsListVariants>
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  </TabsVariantContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-5 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
