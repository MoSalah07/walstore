import { Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getProductReviews, getReviewEligibility } from "@/actions/review.action";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import ReviewForm from "./review-form";

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

// Rating summary, approved reviews and — for customers who received the
// product — the review form.
export default async function ProductReviews({
  productId,
  slug,
  avgRating = 0,
  numReviews = 0,
}: {
  productId: string;
  slug: string;
  avgRating?: number;
  numReviews?: number;
}) {
  const [t, locale, reviews, me] = await Promise.all([
    getTranslations("Product"),
    getLocale(),
    getProductReviews(productId),
    getReviewEligibility(productId),
  ]);

  let action: React.ReactNode = null;
  if (!me.signedIn) {
    action = (
      <Link href={`/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/product/${slug}#reviews`)}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "self-start md:self-auto")}>
        {t("Sign in to review")}
      </Link>
    );
  } else if (me.existing) {
    action = <span className="text-sm text-foreground-secondary">{me.existing.status === "pending" ? t("Review pending") : t("You reviewed")}</span>;
  } else if (!me.purchased) {
    action = <span className="max-w-xs text-sm text-foreground-secondary">{t("Review after delivery")}</span>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex flex-col gap-2.5">
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.02em] md:text-[26px]">{t("Customer Reviews")}</h2>
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
        {action}
      </div>

      {me.signedIn && me.purchased && !me.existing && <ReviewForm productId={productId} />}

      {reviews.length > 0 && (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={r._id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={r.rating} size={16} />
                <span className="sr-only">{t("rated out of 5", { rating: r.rating })}</span>
                <h3 className="font-bold">{r.title}</h3>
              </div>
              <span className="text-[13px] text-muted-foreground">
                {r.userName} · {formatDate(r.createdAt, locale)}
                {r.verifiedPurchase && <span className="ms-2 font-semibold text-success-fg">{t("Verified purchase")}</span>}
              </span>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">{r.body}</p>
              {r.reply && (
                <div className="mt-1 rounded-md bg-background-subtle p-3.5 text-sm">
                  <span className="font-bold">{t("Store reply")}</span>
                  <p className="mt-1 text-foreground-secondary">{r.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
