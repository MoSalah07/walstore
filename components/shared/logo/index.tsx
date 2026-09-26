import { Link } from "@/i18n/routing";
import { WEBSITE_NAME } from "@/constants";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { mark: "size-[30px] rounded-[9px] text-lg", word: "text-[22px]" },
  md: { mark: "size-9 rounded-[10px] text-[22px]", word: "text-[26px]" },
  lg: { mark: "size-12 rounded-[13px] text-[30px]", word: "text-4xl" },
};

// "w" mark + lowercase wordmark. `inverse` for dark grounds (footer, hero).
export function LogoMark({
  size = "md",
  tone = "default",
  className,
}: {
  size?: keyof typeof sizes;
  tone?: "default" | "inverse";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-display font-extrabold leading-none",
        tone === "inverse" ? "bg-inverse-foreground text-inverse" : "bg-primary text-primary-foreground",
        sizes[size].mark,
        className
      )}
    >
      w
    </span>
  );
}

export default function Logo({
  size = "md",
  tone = "default",
  className,
  hideWord = false,
}: {
  size?: keyof typeof sizes;
  tone?: "default" | "inverse";
  className?: string;
  hideWord?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={`${WEBSITE_NAME} home`}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-sm",
        tone === "inverse" ? "text-inverse-foreground" : "text-foreground",
        className
      )}
    >
      <LogoMark size={size} tone={tone} />
      {!hideWord && (
        <span
          dir="ltr"
          className={cn(
            "font-display font-extrabold tracking-[-0.03em]",
            sizes[size].word
          )}
        >
          walstore
        </span>
      )}
    </Link>
  );
}
