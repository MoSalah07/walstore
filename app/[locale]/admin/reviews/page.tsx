import { MessageSquareText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAdminReviews } from "@/actions/review.action";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/routing";
import { REVIEW_STATUSES, ReviewStatus } from "@/models/review.model";
import { cn } from "@/lib/utils";
import ReviewsBoard from "./reviews-board";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.reviews") };
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (REVIEW_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as ReviewStatus) : "pending";
  const [t, locale, data] = await Promise.all([getTranslations("AdminReviews"), getLocale(), getAdminReviews(status)]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Reviews")}</h1>
        <p className="text-[15px] text-foreground-secondary">{t("Reviews sub")}</p>
      </div>
      <nav aria-label={t("Review status")} className="flex gap-6 shadow-[inset_0_-1px_0_rgb(var(--border))]">
        {REVIEW_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "pending" ? "/admin/reviews" : `/admin/reviews?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={cn("flex h-11 items-center gap-1.5 text-sm", s === status ? "font-bold shadow-[inset_0_-2px_0_rgb(var(--foreground))]" : "font-semibold text-foreground-secondary hover:text-foreground")}
          >
            {t(`status.${s}`)}
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{data.counts[s] ?? 0}</span>
          </Link>
        ))}
      </nav>
      {data.reviews.length === 0 ? (
        <EmptyState
          className="rounded-[14px] border border-border bg-card"
          icon={<MessageSquareText />}
          title={t(`empty.${status}`)}
          description={t("Empty help")}
        />
      ) : (
        <ReviewsBoard key={status} reviews={data.reviews} locale={locale} />
      )}
    </div>
  );
}
