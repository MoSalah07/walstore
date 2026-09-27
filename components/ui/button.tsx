import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Pills for actions. Heights: 36 admin/compact · 44 default · 56 hero CTAs.
const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-[background-color,color,border-color,transform] duration-fast ease-standard active:scale-[0.98] disabled:pointer-events-none disabled:bg-border disabled:text-muted-foreground disabled:border-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-border dark:hover:bg-accent",
        outline:
          "border-[1.5px] border-primary bg-card text-foreground hover:bg-background-subtle",
        subtle:
          "border-[1.5px] border-input bg-card text-foreground hover:border-foreground",
        ghost:
          "bg-transparent text-foreground hover:bg-sunken disabled:bg-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-error-fg",
        deal: "bg-deal text-white hover:bg-deal/90 dark:text-[#0B0D12]",
        link: "h-auto rounded-none bg-transparent p-0 text-foreground underline-offset-4 hover:underline active:scale-100 disabled:bg-transparent",
        inverse:
          "bg-inverse-foreground text-inverse hover:bg-inverse-foreground/90",
      },
      size: {
        default: "h-11 px-[18px] text-sm",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-[52px] px-6 text-[15px]",
        xl: "h-14 px-[26px] text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
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
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "pointer-events-none opacity-85"
        )}
        ref={ref}
        disabled={disabled}
        aria-disabled={loading || undefined}
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
