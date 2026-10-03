import { format } from "date-fns";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPaise } from "@/lib/money";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BOOKING_TIMELINE,
  bookingStatusLabel,
  bookingTimelineIndex,
  formatBookingSlot,
} from "@/module/account/lib/booking-ui";

function formatOrderDate(iso) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

function formatDeliveryLine(booking) {
  const addr = booking.delivery?.address?.trim();
  const landmark = booking.delivery?.landmark?.trim();
  const street = [addr, landmark].filter(Boolean).join(", ");
  const place = [booking.cityName, booking.pincode].filter(Boolean).join(", ");
  return [street, place].filter(Boolean).join(" · ");
}

function BookingOrderProgress({ status }) {
  const activeIndex = bookingTimelineIndex(status);
  const cancelled = status === "CANCELLED";
  const completed = status === "COMPLETED";

  if (cancelled) {
    return (
      <div className="border-b border-border/60 px-4 py-3 md:px-6">
        <p className="text-sm text-muted-foreground">This booking was cancelled.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 px-4 py-4 md:px-6">
      <ol className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        {BOOKING_TIMELINE.map((step, index) => {
          const done = activeIndex > index || (completed && index <= activeIndex);
          const current = !completed && activeIndex === index;
          return (
            <li key={step.key} className="min-w-0">
              <p
                className={cn(
                  "truncate text-xs sm:text-sm",
                  current && "font-semibold text-foreground",
                  done && !current && "font-medium text-foreground",
                  !done && !current && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <div
                className={cn(
                  "mt-2 h-1 rounded-full",
                  done && "bg-emerald-600",
                  current && "bg-primary",
                  !done && !current && "bg-muted",
                )}
                aria-hidden
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function BookingCard({ booking }) {
  const title =
    booking.itemCount > 1
      ? `${booking.primaryName} + ${booking.itemCount - 1} more`
      : booking.primaryName;
  const inProgress = booking.status !== "COMPLETED" && booking.status !== "CANCELLED";
  const statusHeadline = inProgress ? "Order in progress" : bookingStatusLabel(booking.status);

  return (
    <article className="w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid gap-4 border-b border-border/60 bg-muted/30 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <div className="min-w-0">
          <p className="text-muted-foreground">Status</p>
          <p className="mt-0.5 flex items-center gap-2 font-medium text-foreground">
            {inProgress ? (
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            ) : null}
            <span className="truncate">{statusHeadline}</span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Order number</p>
          <p className="mt-0.5 truncate font-mono text-xs font-medium text-foreground sm:text-sm">
            {booking.reference}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Setup date</p>
          <p className="mt-0.5 font-medium text-foreground">{formatOrderDate(booking.scheduledAt)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Total</p>
          <p className="mt-0.5 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatPaise(booking.subtotalPaise)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <p className="flex items-start gap-2 text-foreground">
            <CalendarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              <span className="text-muted-foreground">Setup slot: </span>
              <span className="font-medium">{formatBookingSlot(booking.scheduledAt)}</span>
            </span>
          </p>
          <p className="flex items-start gap-2 text-foreground">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">{formatDeliveryLine(booking) || "Delivery address on file"}</span>
          </p>
        </div>
        <Button asChild className="shrink-0 rounded-lg">
          <Link to={`/account/bookings/${booking.id}`}>Order details</Link>
        </Button>
      </div>

      <BookingOrderProgress status={booking.status} />

      <Link
        to={`/account/bookings/${booking.id}`}
        className="group flex gap-4 p-4 transition-colors hover:bg-muted/20 md:px-6 md:py-5"
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
          {booking.primaryImageUrl ? (
            <img
              src={booking.primaryImageUrl}
              alt=""
              className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <DecoryImageFallback className="size-full" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="font-heading text-base font-semibold leading-snug tracking-tight sm:max-w-[70%]">
              {title}
            </h3>
            <p className="shrink-0 text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatPaise(booking.subtotalPaise)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span>Qty: {booking.itemCount}</span>
            <span aria-hidden>·</span>
            <span>{booking.cityName}</span>
            {booking.canReview ? (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Leave a review</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-16 animate-pulse bg-muted/40" />
      <div className="space-y-3 border-b border-border/60 p-4 md:px-6">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-12 animate-pulse bg-muted/20" />
      <div className="flex gap-4 p-4 md:px-6">
        <div className="size-20 shrink-0 animate-pulse rounded-lg bg-muted sm:size-24" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
