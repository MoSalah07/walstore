import { cn } from "@/lib/utils";

// Soft 1.6s shimmer that mirrors the real layout; still with reduced motion.
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-sunken bg-[linear-gradient(90deg,transparent_0%,rgb(var(--card)/0.7)_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
