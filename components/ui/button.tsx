import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// One control scale shared with inputs:
// xs 28 · sm 32 · md 36 (admin, dense rows) · default 40 · lg 44 · xl 48 (hero / checkout).
const buttonBase = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.005em] transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-fast ease-standard active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-button hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-border dark:hover:bg-accent",
        outline:
          "border border-input bg-card text-foreground shadow-xs hover:border-foreground/25 hover:bg-background-subtle",
        ghost: "text-foreground hover:bg-sunken",
        "destructive-outline":
          "border border-input bg-card text-destructive shadow-xs hover:border-destructive/30 hover:bg-error-bg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-button hover:bg-error-fg",
        deal: "bg-deal text-deal-foreground shadow-button hover:bg-deal/90",
        inverse:
          "bg-inverse-accent text-inverse-accent-foreground shadow-button hover:bg-inverse-accent/90",
        link: "text-foreground underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        xs: "h-7 rounded-sm px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-8 rounded-sm px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-9 rounded-[10px] px-3.5 text-[13px]",
        default: "h-10 rounded-[10px] px-4 text-sm",
        lg: "h-11 rounded-[10px] px-5 text-sm",
        xl: "h-12 rounded-md px-6 text-[15px]",
        "icon-xs": "size-7 rounded-sm [&_svg]:size-3.5",
        "icon-sm": "size-8 rounded-sm",
        "icon-md": "size-9 rounded-[10px]",
        icon: "size-10 rounded-[10px]",
      },
      // Pill keeps the old storefront shape for chips and floating CTAs.
      shape: {
        default: "",
        pill: "rounded-full",
      },
      block: {
        true: "w-full",
      },
    },
    compoundVariants: [
      { variant: "link", className: "h-auto rounded-none px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonBase>;

// Merged so a caller's class (e.g. `w-auto`) always wins over the variant's.
function buttonVariants({
  className,
  ...props
}: ButtonVariantProps & { className?: string } = {}) {
  return cn(buttonBase(props), className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      block,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={buttonVariants({ variant, size, shape, block, className })}
        ref={ref}
        disabled={disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonVariantProps };
