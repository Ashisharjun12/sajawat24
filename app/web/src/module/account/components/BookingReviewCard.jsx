import { format } from "date-fns";
import { BadgeCheckIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StarRow({ rating, className }) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={cn(
            "size-4",
            index < rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function formatReviewDate(value) {
  if (!value) return "";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "";
  }
}

export function BookingReviewCard({ order, onWriteReview }) {
  if (order.status !== "COMPLETED") return null;

  if (order.reviewSubmitted && order.review) {
    return (
      <Card className="shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-lg">Your review</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <BadgeCheckIcon className="size-4 text-emerald-600" aria-hidden />
            Verified purchase · {formatReviewDate(order.review.reviewedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StarRow rating={order.review.rating} />
          <p className="text-sm leading-relaxed text-foreground">{order.review.body}</p>
        </CardContent>
      </Card>
    );
  }

  if (!order.canReview) return null;

  return (
    <Card className="border-emerald-200/80 bg-emerald-50/40 shadow-none ring-0 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle className="text-lg">How was your setup?</CardTitle>
        <CardDescription>
          Your booking is complete. Share a quick review to help other hosts choose with confidence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onWriteReview}>Write a review</Button>
      </CardContent>
    </Card>
  );
}
