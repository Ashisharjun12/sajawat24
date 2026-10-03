import { useCallback, useEffect, useState } from "react";
import { BookingReviewCard } from "@/module/account/components/BookingReviewCard";
import { WriteBookingReviewDialog } from "@/module/account/components/WriteBookingReviewDialog";
import { Link, useParams } from "react-router-dom";
import { getApiError } from "@/api/api";
import { getOrder } from "@/api/orders.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { VendorContactCard } from "@/module/account/components/VendorContactCard";
import { BookingRefundSection } from "@/module/account/components/BookingRefundSection";
import { BOOKING_STATUS_EVENT } from "@/module/account/lib/booking.events";
import {
  BOOKING_TIMELINE,
  bookingStatusLabel,
  bookingTimelineIndex,
  formatBookingSlot,
} from "@/module/account/lib/booking-ui";
import { InstantDispatchBanner } from "@/module/booking/components/InstantDispatchBanner";
import { InstantTripTrackingMap } from "@/module/account/components/InstantTripTrackingMap";

function BookingTimeline({ status }) {
  const activeIndex = bookingTimelineIndex(status);
  const cancelled = status === "CANCELLED";

  if (cancelled) {
    return (
      <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        This booking was cancelled.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {BOOKING_TIMELINE.map((step, index) => {
        const done = activeIndex > index || (activeIndex === index && status === "COMPLETED");
        const current = activeIndex === index && status !== "COMPLETED";
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-emerald-600 bg-emerald-600 text-white",
                  current && "border-primary bg-primary/10 text-foreground",
                  !done && !current && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              {index < BOOKING_TIMELINE.length - 1 ? (
                <span
                  className={cn(
                    "my-1 w-px flex-1 min-h-6",
                    done ? "bg-emerald-600" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <div className="pb-5 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  current ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function BookingDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const loadOrder = useCallback(async (showSpinner = false) => {
    if (!orderId) {
      setStatus("error");
      setError("Missing booking reference");
      return;
    }
    if (showSpinner) setStatus("loading");
    try {
      const data = await getOrder(orderId);
      setOrder(data);
      setStatus("ready");
      setError("");
    } catch (err) {
      setError(getApiError(err));
      setStatus("error");
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder(true);
  }, [loadOrder]);

  useEffect(() => {
    if (!orderId || !order) return undefined;
    const activeTrip = ["CONFIRMED", "ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(order.status);
    if (!activeTrip) return undefined;

    const waitingForVendor =
      order.status === "ASSIGNED" && order.assignee?.vendorResponse === "pending";
    const pollMs =
      order.status === "EN_ROUTE" || order.status === "ON_SITE"
        ? 30000
        : waitingForVendor
          ? 10000
          : 30000;

    const timer = setInterval(() => {
      void loadOrder(false);
    }, pollMs);

    return () => clearInterval(timer);
  }, [orderId, order?.status, order?.assignee?.vendorResponse, loadOrder]);

  useEffect(() => {
    if (!orderId) return undefined;

    function onBookingStatus(event) {
      const payload = event.detail;
      if (payload?.orderId === orderId) {
        void loadOrder(false);
      }
    }

    window.addEventListener(BOOKING_STATUS_EVENT, onBookingStatus);
    return () => window.removeEventListener(BOOKING_STATUS_EVENT, onBookingStatus);
  }, [orderId, loadOrder]);

  if (status === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Booking not found</CardTitle>
            <CardDescription>{error || "We couldn’t load this booking."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/account/bookings">All bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payLabel = order.paymentMethod === "COD" ? "Cash on delivery" : "Pay online";
  const vendorAccepted = order.assignee?.vendorResponse === "accepted";
  const canChatWithVendor =
    vendorAccepted && order.status !== "CANCELLED" && order.status !== "COMPLETED";
  const showContactCard =
    order.status !== "CANCELLED" &&
    (order.status === "COMPLETED" ? Boolean(order.serviceContact) : vendorAccepted) &&
    (order.serviceContact || order.assignee);

  return (
    <div className="w-full space-y-6">
      <div>
        <Link
          to="/account/bookings"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All bookings
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-extrabold tracking-tight">Booking details</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">{order.reference}</p>
      </div>

      <Card className="shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
          <CardDescription>{bookingStatusLabel(order.status)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstantDispatchBanner order={order} />
          <InstantTripTrackingMap
            orderId={order.id}
            orderStatus={order.status}
            fulfillmentType={order.fulfillmentType}
          />
          {order.status === "EN_ROUTE" ? (
            <p className="rounded-2xl bg-sky-500/10 px-4 py-3 text-sm text-foreground">
              Your decorator is on the way to your location.
            </p>
          ) : null}
          {order.status === "ON_SITE" ? (
            <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
              {order.deliveryCodePending
                ? "Setup is in progress. Share your completion code with your decorator when they ask."
                : "Your decorator has arrived and setup is in progress."}
            </p>
          ) : null}
          <BookingTimeline status={order.status} />
        </CardContent>
      </Card>

      <Card className="shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-lg">Schedule & delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Setup slot</p>
            <p className="font-medium">{formatBookingSlot(order.scheduledAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Delivery</p>
            <p className="font-medium">
              {order.delivery.cityName} · {order.delivery.pincode}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{order.delivery.address}</p>
            {order.delivery.landmark ? (
              <p className="mt-1 text-muted-foreground">Landmark: {order.delivery.landmark}</p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground">Payment</p>
            <p className="font-medium">{payLabel}</p>
          </div>
        </CardContent>
      </Card>

      {showContactCard ? (
        <VendorContactCard
          serviceContact={order.serviceContact}
          assignee={order.assignee}
          orderId={orderId}
          showChat={canChatWithVendor}
        />
      ) : null}

      <BookingRefundSection order={order} />

      <BookingReviewCard order={order} onWriteReview={() => setReviewDialogOpen(true)} />

      <WriteBookingReviewDialog
        order={order}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onSubmitted={(meta) => {
          setOrder((current) =>
            current
              ? {
                  ...current,
                  canReview: meta.canReview,
                  reviewSubmitted: meta.reviewSubmitted,
                  review: meta.review,
                }
              : current,
          );
        }}
      />

      <Card className="shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="size-16 shrink-0 rounded-2xl bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                {item.addons?.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {item.addons.map((addon) => (
                      <li key={addon.id}>
                        + {addon.name} ({formatPaise(addon.pricePaise)})
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-2 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatPaise(item.lineTotalPaise)}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatPaise(order.subtotalPaise)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
