import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Surfaces. `size` sets the padding once as --card-p and every part reads it:
// a padded card pads itself (parts sit flush inside, spaced by `gap`); a
// `flush` card has no padding so tables, lists and images reach the edge, and
// its Header/Content/Footer pad themselves instead (--card-inset).
// cardVariants() is the surface only (keeps the element's own layout);
// <Card> adds a vertical stack so parts compose without extra classes.
const cardBase = cva(
  "group/card bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "border border-border shadow-card",
        elevated: "border border-border-soft shadow-md",
        interactive:
          "border border-border shadow-card transition-[border-color,box-shadow,transform] duration-base ease-standard hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
        muted: "border border-border-soft bg-background-subtle",
        ghost: "",
      },
      size: {
        sm: "rounded-md [--card-p:1rem]",
        md: "rounded-lg [--card-p:1.25rem]",
        lg: "rounded-lg [--card-p:1.25rem] md:[--card-p:1.5rem]",
        xl: "rounded-xl [--card-p:1.5rem] md:[--card-p:2.5rem]",
      },
      flush: {
        true: "[--card-inset:var(--card-p)]",
        false: "p-[--card-p] [--card-inset:0px]",
      },
    },
    defaultVariants: { variant: "default", size: "md", flush: false },
  }
);

type CardVariantProps = VariantProps<typeof cardBase>;

// For elements that are already a <section>, <li>, <Link>… — same look, no wrapper.
function cardVariants({
  className,
  ...props
}: CardVariantProps & { className?: string } = {}) {
  return cn(cardBase(props), className);
}

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariantProps {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, flush, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-slot="card"
        className={cardVariants({ variant, size, flush, className: cn("flex flex-col gap-4", className) })}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Title + description on the start side, an optional CardAction on the end.
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn(
      "grid auto-rows-min items-start gap-x-4 gap-y-0.5 p-[--card-inset] has-[[data-slot=card-action]]:grid-cols-[1fr_auto]",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "h2";
  return (
    <Comp
      ref={ref}
      data-slot="card-title"
      className={cn("text-base font-semibold leading-6 tracking-[-0.01em]", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("text-[13px] leading-5 text-foreground-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-action"
    className={cn(
      "col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start justify-self-end",
      className
    )}
    {...props}
  />
));
CardAction.displayName = "CardAction";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn(
      "px-[--card-inset] pb-[--card-inset] first:pt-[--card-inset]",
      className
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn(
      "flex items-center gap-2 px-[--card-inset] pb-[--card-inset] first:pt-[--card-inset]",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Bleeds to the card's edges inside a padded card (images, tables, dividers).
const CardSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-section"
    className={cn(
      "mx-[calc(var(--card-inset)-var(--card-p))] first:mt-[calc(var(--card-inset)-var(--card-p))] last:mb-[calc(var(--card-inset)-var(--card-p))]",
      className
    )}
    {...props}
  />
));
CardSection.displayName = "CardSection";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  CardSection,
  cardVariants,
};
export type { CardProps, CardVariantProps };
