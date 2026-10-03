import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function distributionPercent(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export function ProductReviewsSummary({ summary, className, availableCount }) {
  const ratingAvg = summary?.ratingAvg;
  const reviewCount = summary?.reviewCount ?? 0;
  const distribution = summary?.distribution ?? {};

  if (!reviewCount) return null;

  const rows = [5, 4, 3, 2, 1];
  const basedOn = availableCount ?? reviewCount;

  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/25",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
              {ratingAvg != null ? Number(ratingAvg).toFixed(1) : "—"}
            </span>
            <StarIcon className="size-6 fill-amber-400 text-amber-400" aria-hidden />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">out of 5</p>
          <p className="text-sm font-medium text-foreground/80">
            {reviewCount.toLocaleString()} review{reviewCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-[220px]">
          {rows.map((stars) => {
            const count = distribution[stars] ?? distribution[String(stars)] ?? 0;
            const percent = distributionPercent(count, reviewCount);
            return (
              <div
                key={stars}
                className="grid grid-cols-[1.25rem_1fr_2.25rem] items-center gap-2 text-xs"
              >
                <span className="text-muted-foreground">{stars}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-right tabular-nums text-muted-foreground">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 border-t border-emerald-200/60 pt-3 text-xs text-muted-foreground dark:border-emerald-900/40">
        Based on {basedOn.toLocaleString()} available review{basedOn === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
