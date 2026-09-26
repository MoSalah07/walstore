import { cn } from "@/lib/utils";

export function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
  lg: "size-[72px] text-[26px]",
};

export function Avatar({
  name,
  size = "md",
  tone = "ink",
  className,
}: {
  name?: string | null;
  size?: keyof typeof sizes;
  tone?: "ink" | "soft";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-extrabold",
        tone === "ink"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-primary-hover dark:text-foreground",
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
