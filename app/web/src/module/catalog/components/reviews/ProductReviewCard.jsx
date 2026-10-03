import { format } from "date-fns";
import { MapPinIcon, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-orange-100 text-orange-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

function initials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] ?? "").toUpperCase();
}

function avatarTone(name) {
  const code = String(name ?? "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_TONES[code % AVATAR_TONES.length];
}

function formatReviewDate(value) {
  if (!value) return "";
  try {
    return format(new Date(value), "d MMM yyyy");
  } catch {
    return "";
  }
}

function formatRatingBadge(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n)) return "—";
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export function ProductReviewCard({ review, className, variant = "card" }) {
  const avatarUrl = review?.avatar?.url || review?.avatar?.thumbnailUrl;
  const dateLabel = formatReviewDate(review?.reviewedAt);
  const locationLine = [review.reviewerCity, dateLabel].filter(Boolean).join(" · ");

  if (variant === "pdp") {
    return (
      <article className={cn("border-b border-border/60 py-4 last:border-b-0", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold",
                avatarTone(review?.reviewerName),
              )}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(review?.reviewerName)
              )}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">{review.reviewerName}</h3>
              {locationLine ? (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {review.reviewerCity ? <MapPinIcon className="size-3 shrink-0" /> : null}
                  <span className="truncate">{locationLine}</span>
                </p>
              ) : null}
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-emerald-600"
          >
            <StarIcon className="size-3 fill-white text-white" aria-hidden />
            {formatRatingBadge(review.rating)}
          </span>
        </div>
        {review.body ? (
          <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{review.body}</p>
        ) : null}
      </article>
    );
  }

  return (
    <article className={cn("rounded-2xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
              avatarTone(review?.reviewerName),
            )}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials(review?.reviewerName)
            )}
          </span>
          <div className="min-w-0">
            <h3 className="font-medium">{review.reviewerName}</h3>
            {review.reviewerCity ? (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPinIcon className="size-3" />
                {review.reviewerCity}
              </p>
            ) : null}
          </div>
        </div>
        {dateLabel ? (
          <time className="shrink-0 text-xs text-muted-foreground">{dateLabel}</time>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{review.body}</p>
    </article>
  );
}
