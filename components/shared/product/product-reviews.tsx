import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Stars({ value, size = 22 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn("text-[#B45309]", i <= Math.round(value) && "fill-[#B45309]")}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

// Rating summary + "Write a review". Review list and form attach here.
export default async function ProductReviews({
  avgRating = 0,
  numReviews = 0,
  children,
  writeHref = "/sign-in",
}: {
  avgRating?: number;
  numReviews?: number;
  children?: React.ReactNode;
  writeHref?: string;
}) {
  const t = await getTranslations("Product");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex flex-col gap-2.5">
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.02em] md:text-[26px]">
            {t("Customer Reviews")}
          </h2>
          <div className="flex items-center gap-3">
            <Stars value={avgRating} />
            <span className="sr-only">{t("rated out of 5", { rating: avgRating.toFixed(1) })}</span>
            {numReviews > 0 && (
              <span className="text-sm font-semibold text-foreground-secondary tabular-nums">
                {avgRating.toFixed(1)} · {t("n reviews", { count: numReviews })}
              </span>
            )}
          </div>
          {numReviews === 0 && <p className="text-base text-foreground-secondary">{t("No reviews yet")}</p>}
        </div>
        <Link href={writeHref} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "self-start md:self-auto")}>
          {t("Write a review")}
        </Link>
      </div>
      {children}
    </div>
  );
}
