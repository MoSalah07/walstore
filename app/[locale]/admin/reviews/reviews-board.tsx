"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { AdminReview, moderateReview } from "@/actions/review.action";
import { StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const pill = { pending: "pending", approved: "delivered", rejected: "cancelled" } as const;

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={cn("text-[#B45309]", i <= n && "fill-[#B45309]")} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export default function ReviewsBoard({ reviews, locale }: { reviews: AdminReview[]; locale: string }) {
  const t = useTranslations("AdminReviews");
  const router = useRouter();
  const [sel, setSel] = useState(reviews[0]?._id);
  const cur = reviews.find((r) => r._id === sel) ?? reviews[0];
  const [reply, setReply] = useState(cur?.reply ?? "");
  const [pending, start] = useTransition();

  const pick = (r: AdminReview) => {
    setSel(r._id);
    setReply(r.reply ?? "");
  };
  const act = (status: "approved" | "rejected") =>
    start(async () => {
      const r = await moderateReview(cur!._id, status, reply);
      if (r.ok) toast.success(status === "approved" ? t("Approved toast") : t("Rejected toast"));
      router.refresh();
    });

  if (!cur) return null;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <ul className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card">
        {reviews.map((r) => (
          <li key={r._id} className="border-b border-border-soft last:border-0">
            <button
              type="button"
              onClick={() => pick(r)}
              aria-pressed={r._id === cur._id}
              className={cn("flex w-full gap-3 px-4 py-3.5 text-start transition-colors duration-fast", r._id === cur._id ? "bg-secondary shadow-[inset_3px_0_0_rgb(var(--primary))] rtl:shadow-[inset_-3px_0_0_rgb(var(--primary))]" : "hover:bg-background-subtle")}
            >
              <span className="relative size-12 shrink-0 rounded-sm bg-sunken dark:bg-[#E9ECF1]">
                {r.productImage && <Image src={r.productImage} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex justify-between gap-2">
                  <span className="truncate text-sm font-bold">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(r.createdAt, locale)}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-foreground-secondary">
                  <Stars n={r.rating} size={12} />· {r.userName}
                </span>
                <span className="truncate text-xs text-muted-foreground">{r.productName}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <section aria-label={t("Review details")} className="flex flex-col gap-5 rounded-[14px] border border-border bg-card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <span className="relative size-14 shrink-0 rounded-md bg-sunken dark:bg-[#E9ECF1]">
            {cur.productImage && <Image src={cur.productImage} alt="" fill sizes="56px" className="object-contain p-1.5 mix-blend-multiply" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <Link href={`/admin/products/${cur.product}`} className="truncate font-semibold hover:underline">{cur.productName}</Link>
            <span className="text-[13px] text-foreground-secondary">
              {cur.userName}
              {cur.verifiedPurchase && ` · ${t("Verified purchase")}`} · {formatDateTime(cur.createdAt, locale)}
            </span>
          </span>
          <StatusPill status={pill[cur.status]}>{t(`status.${cur.status}`)}</StatusPill>
        </div>
        <div role="img" aria-label={t("rating label", { n: cur.rating })}>
          <Stars n={cur.rating} size={22} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{cur.title}</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">{cur.body}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rv-reply">
            {t("Public reply")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
          </Label>
          <Textarea id="rv-reply" rows={3} value={reply} maxLength={1000} onChange={(e) => setReply(e.target.value)} placeholder={t("Reply placeholder")} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {cur.status !== "rejected" && (
            <Button variant="subtle" className="text-destructive" loading={pending} onClick={() => act("rejected")}>
              {t("Reject")}
            </Button>
          )}
          <Button loading={pending} onClick={() => act("approved")}>
            <Check aria-hidden />
            {cur.status === "approved" ? t("Update reply") : t("Approve publish")}
          </Button>
        </div>
      </section>
    </div>
  );
}
