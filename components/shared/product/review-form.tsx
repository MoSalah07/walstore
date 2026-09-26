"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { submitReview } from "@/actions/review.action";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("Product");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <Alert variant="success">{t("Review thanks")}</Alert>;

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return setError(t("Pick a rating"));
        start(async () => {
          const r = await submitReview({ productId, rating, title, body });
          if (r.ok) setDone(true);
          else setError(r.error === "invalid" ? t("Review invalid") : r.error === "duplicate" ? t("Already reviewed") : t("Review failed"));
        });
      }}
    >
      <h3 className="text-lg font-bold">{t("Write a review")}</h3>
      {error && <Alert variant="error">{error}</Alert>}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">{t("Your rating")}</legend>
        <div className="flex gap-1" role="radiogroup" aria-label={t("Your rating")} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t("n stars", { count: n })}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="flex size-10 items-center justify-center rounded-sm"
            >
              <Star className={cn("size-7 text-[#B45309]", n <= (hover || rating) && "fill-[#B45309]")} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rv-title">{t("Review title")}</Label>
        <Input id="rv-title" size="sm" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rv-body">{t("Review body")}</Label>
        <Textarea id="rv-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        <span className="text-[13px] text-foreground-secondary">{t("Review help")}</span>
      </div>
      <Button type="submit" loading={pending} className="self-start">
        {t("Submit review")}
      </Button>
    </form>
  );
}
