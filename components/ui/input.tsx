import * as React from "react";

import { cn } from "@/lib/utils";

// Matches Button: 40 storefront (`default`) / 36 admin (`size="sm"`, Button `md`). Focus: 2px ink border + soft halo.
export const inputClasses =
  "flex w-full min-w-0 rounded-[10px] border border-input bg-card px-3 text-sm shadow-xs text-foreground transition-[border-color,box-shadow] duration-fast ease-standard placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:shadow-[0_0_0_4px_rgb(var(--secondary))] focus-visible:outline-none aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:shadow-[0_0_0_4px_rgb(var(--error-bg))] disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium";

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "default" | "sm";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    return (
      <input
        suppressHydrationWarning
        type={type}
        className={cn(
          inputClasses,
          size === "sm" ? "h-9 text-[13px]" : "h-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputClasses, "min-h-24 resize-y py-2.5 leading-6", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
