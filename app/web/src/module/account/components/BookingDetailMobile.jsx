import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ClockIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { BookingRefundSection } from "@/module/account/components/BookingRefundSection";
import { BookingReviewCard } from "@/module/account/components/BookingReviewCard";
import { InstantTripTrackingMap } from "@/module/account/components/InstantTripTrackingMap";
import { isLiveTripOrder } from "@/module/account/lib/live-trip";
import { normalizeContacts } from "@/module/account/lib/order-contacts";
import {
  BOOKING_TIMELINE,
  bookingStatusLabel,
  bookingTimelineIndex,
  formatBookingSlot,
} from "@/module/account/lib/booking-ui";
import { InstantDispatchBanner } from "@/module/booking/components/InstantDispatchBanner";

/** Mobile web order details, matching the user app (OrderDetailScreen / OrderDetailTrackingLayout). */

const HERO_PLACEHOLDER =
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=480&fit=crop";

const BOOKINGS_HREF = "/account/bookings";

/** Keeps the last card clear of the fixed mobile bottom nav. */
const BOTTOM_NAV_CLEARANCE = "pb-[calc(var(--mobile-bottom-nav-offset,0px)+1.5rem)]";

const TIMELINE_STATUSES = new Set([
  "CONFIRMED",
  "ASSIGNED",
  "EN_ROUTE",
  "ON_SITE",
  "COMPLETED",
  "DISPUTED",
]);

function statusDisplayLabel(order) {
  return order.checkoutAbandoned ? "Payment not completed" : bookingStatusLabel(order.status);
}

function statusTone(order) {
  if (order.checkoutAbandoned || order.status === "CANCELLED") return "cancelled";
  if (order.status === "COMPLETED") return "success";
  if (order.status === "PENDING_PAYMENT" || order.status === "DISPUTED") return "payment";
  if (order.status === "DRAFT") return "muted";
  return "active";
}

const PILL_CLASS = {
  active: "bg-primary/10 text-primary",
  payment: "bg-cta/15 text-cta",
  success: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

const PILL_TEXT_CLASS = {
  active: "text-primary",
  payment: "text-cta",
  success: "text-success",
  cancelled: "text-destructive",
  muted: "text-muted-foreground",
};

function orderTotalPaise(order) {
  return order.totalPaise ?? order.subtotalPaise;
}

function initials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Section({ className, children }) {
  return (
    <div className={cn("rounded-[var(--r-card)] border border-border bg-card p-4", className)}>
      {children}
    </div>
  );
}

function OrderTimeline({ order }) {
  const { status, checkoutAbandoned } = order;

  if (status === "PENDING_PAYMENT" && !checkoutAbandoned) {
    return (
      <p className="rounded-xl bg-cta/10 px-4 py-3 text-sm leading-5 text-cta">
        Complete payment to confirm this booking. Your bag is saved until you pay or the session
        expires.
      </p>
    );
  }

  if (status === "CANCELLED" || checkoutAbandoned) {
    return (
      <div className={cn("rounded-xl px-4 py-3", PILL_CLASS.cancelled)}>
        <p className="text-sm font-semibold">{statusDisplayLabel(order)}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {checkoutAbandoned
            ? "No payment was taken. You can checkout again from your bag anytime."
            : "This booking was cancelled."}
        </p>
      </div>
    );
  }

  const activeIndex = bookingTimelineIndex(status);
  const completed = status === "COMPLETED";

  return (
    <ol className="flex flex-col gap-1">
      {BOOKING_TIMELINE.map((step, index) => {
        const done = activeIndex > index || (completed && index <= activeIndex);
        const current = !completed && activeIndex === index;
        const isLast = index === BOOKING_TIMELINE.length - 1;
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done && "border-success bg-success text-white",
                  current && "border-primary bg-primary/10 text-primary",
                  !done && !current && "border-border bg-background text-muted-foreground",
                )}>
                {done ? "✓" : index + 1}
              </span>
              {!isLast ? (
                <span
                  className={cn("my-1 min-h-4 w-0.5 flex-1", done ? "bg-success" : "bg-border")}
                />
              ) : null}
            </div>
            <p
              className={cn(
                "min-w-0 flex-1 pt-1.5 text-sm",
                !isLast && "pb-4",
                current || done ? "font-semibold text-foreground" : "text-muted-foreground",
              )}>
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function ContactRow({ name, subtitle, phone, chatHref }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        aria-hidden>
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">{name}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {chatHref ? (
          <Link
            to={chatHref}
            aria-label={`Chat with ${name}`}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors active:bg-muted">
            <MessageCircleIcon className="size-5" />
          </Link>
        ) : null}
        {phone ? (
          <a
            href={`tel:${phone}`}
            aria-label={`Call ${name}`}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity active:opacity-80">
            <PhoneIcon className="size-5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function OrderContactCard({ order, showContact, canChat }) {
  if (!showContact) return null;
  const contacts = normalizeContacts({
    serviceContact: order.serviceContact,
    assignee: order.assignee,
  });
  if (!contacts) return null;

  const chatHref = canChat ? `${BOOKINGS_HREF}/${order.id}/chat` : null;

  return (
    <Section className="flex flex-col gap-4">
      <ContactRow {...contacts.primary} chatHref={chatHref} />
      {contacts.vendorSupport ? (
        <div className="border-t border-border/60 pt-4">
          <ContactRow {...contacts.vendorSupport} />
        </div>
      ) : null}
    </Section>
  );
}

function InfoRow({ icon: Icon, iconClassName = "text-primary", label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className={cn("size-5 shrink-0", iconClassName)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}

function OrderInfoRows({ order, showCustomerName = false }) {
  const place = [order.delivery?.cityName, order.delivery?.pincode].filter(Boolean).join(", ");
  return (
    <div className="flex flex-col gap-4">
      <InfoRow icon={ClockIcon} label="Setup slot">
        <p className="text-sm text-foreground">{formatBookingSlot(order.scheduledAt)}</p>
      </InfoRow>
      <InfoRow icon={MapPinIcon} label="Delivery">
        <p className="whitespace-pre-wrap text-sm text-foreground">{order.delivery?.address}</p>
        {place ? <p className="text-sm text-muted-foreground">{place}</p> : null}
        {order.delivery?.landmark ? (
          <p className="text-sm text-muted-foreground">Landmark: {order.delivery.landmark}</p>
        ) : null}
      </InfoRow>
      {order.customer?.phone ? (
        <InfoRow icon={PhoneIcon} iconClassName="text-muted-foreground" label="Contact">
          {showCustomerName && order.customer?.name ? (
            <p className="text-sm text-foreground">{order.customer.name}</p>
          ) : null}
          <p className={cn("text-sm", showCustomerName ? "text-muted-foreground" : "text-foreground")}>
            {order.customer.phone}
          </p>
        </InfoRow>
      ) : null}
    </div>
  );
}

function OrderItemsList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-foreground">Items</p>
      {items.map((item, index) => (
        <div key={item.id ?? `${item.productId}-${index}`} className="flex gap-3">
          <img
            src={item.imageUrl || HERO_PLACEHOLDER}
            alt=""
            loading="lazy"
            className="size-14 shrink-0 rounded-lg bg-muted object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
            {item.addons?.length ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.addons.map((addon) => `+ ${addon.name}`).join(", ")}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusNotes({ order }) {
  return (
    <>
      <InstantDispatchBanner order={order} />
      {order.status === "EN_ROUTE" ? (
        <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-foreground">
          Your decorator is on the way to your location.
        </p>
      ) : null}
      {order.status === "ON_SITE" ? (
        <p className="rounded-2xl bg-success/15 px-4 py-3 text-sm text-foreground">
          {order.deliveryCodePending
            ? "Your decorator has arrived. Share your completion code when they ask."
            : "Your decorator is on site and setup is in progress."}
        </p>
      ) : null}
      {order.checkoutAbandoned ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm leading-5 text-destructive">
          Payment was not completed for this attempt. Nothing was charged. Book again from your bag
          when you are ready.
        </p>
      ) : null}
      {!order.checkoutAbandoned && order.status === "PENDING_PAYMENT" ? (
        <p className="rounded-2xl bg-cta/10 px-4 py-3 text-sm leading-5 text-cta">
          This booking is waiting for payment. Complete checkout to confirm your slot.
        </p>
      ) : null}
    </>
  );
}

function TimelineSection({ order }) {
  const showTimeline = !order.checkoutAbandoned && TIMELINE_STATUSES.has(order.status);
  const showStatusOnly =
    !showTimeline &&
    (order.status === "CANCELLED" || order.status === "PENDING_PAYMENT" || order.checkoutAbandoned);
  if (!showTimeline && !showStatusOnly) return null;
  return (
    <Section>
      <p className="mb-4 font-semibold text-foreground">
        {showTimeline ? "Booking progress" : "Status"}
      </p>
      <OrderTimeline order={order} />
    </Section>
  );
}

/** Bottom sheet opened from "Details" on the map-first tracking layout. */
function OrderDetailsDrawer({ open, onOpenChange, order }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down" showSwipeHandle>
      <DrawerContent className="max-h-[85dvh] rounded-t-[var(--r-sheet)] border-t [--drawer-inset:0px]">
        <div
          className="overflow-y-auto overscroll-contain px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          data-lenis-prevent>
          <DrawerTitle className="mb-1 text-lg font-bold">Order details</DrawerTitle>
          <DrawerDescription className="mb-4 font-mono text-xs">{order.reference}</DrawerDescription>

          <div className="mb-4 rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatPaise(orderTotalPaise(order))}
            </p>
          </div>

          <OrderInfoRows order={order} showCustomerName />

          <div className="mt-5">
            <OrderItemsList items={order.items} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TrackingLayout({ order, showContact, canChat }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const overlayChip = "bg-background/90 shadow-sm backdrop-blur-sm";

  return (
    <div className={BOTTOM_NAV_CLEARANCE}>
      <div className="relative h-[55dvh] min-h-72 w-full">
        <InstantTripTrackingMap
          orderId={order.id}
          orderStatus={order.status}
          fulfillmentType={order.fulfillmentType}
          variant="hero"
          className="size-full"
        />
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex items-center justify-between gap-2 px-3">
          <Link
            to={BOOKINGS_HREF}
            aria-label="Back to bookings"
            className={cn(
              "pointer-events-auto flex size-10 items-center justify-center rounded-full text-foreground",
              overlayChip,
            )}>
            <ChevronLeftIcon className="size-6" />
          </Link>
          <div className={cn("min-w-0 rounded-full px-4 py-2 text-center", overlayChip)}>
            <p className="text-sm font-semibold text-foreground">Order tracking</p>
            <p className="truncate text-xs text-muted-foreground">{statusDisplayLabel(order)}</p>
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className={cn(
              "pointer-events-auto rounded-full px-3 py-2 text-sm font-semibold text-foreground",
              overlayChip,
            )}>
            Details
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">
        <StatusNotes order={order} />
        <OrderContactCard order={order} showContact={showContact} canChat={canChat} />
        <TimelineSection order={order} />
      </div>

      <OrderDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} order={order} />
    </div>
  );
}

function StandardLayout({ order, showContact, canChat, onWriteReview }) {
  const heroImage = order.items?.find((item) => item.imageUrl)?.imageUrl ?? HERO_PLACEHOLDER;
  const tone = statusTone(order);
  const hasMultipleItems = (order.items?.length ?? 0) > 1;

  return (
    <div className={cn("px-4 pt-3", BOTTOM_NAV_CLEARANCE)}>
      <div className="flex items-center gap-2">
        <Link
          to={BOOKINGS_HREF}
          aria-label="Back to bookings"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted">
          <ChevronLeftIcon className="size-6" />
        </Link>
        <h1 className="font-heading text-xl font-bold tracking-tight">Order details</h1>
      </div>

      <div className="mt-4 flex flex-col gap-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative h-44 w-full bg-muted">
            <img src={heroImage} alt="" className="size-full object-cover" />
            {/* Solid base so the status reads over any photo; the text carries the tone colour. */}
            <span
              className={cn(
                "absolute top-4 left-4 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold shadow-sm",
                PILL_TEXT_CLASS[tone],
              )}>
              {statusDisplayLabel(order)}
            </span>
          </div>
          <div className="flex flex-col gap-1 border-t border-border/60 bg-muted/20 px-4 py-3">
            <p className="line-clamp-2 text-lg font-bold text-foreground">
              {order.items?.[0]?.name ?? "Your booking"}
              {hasMultipleItems ? (
                <span className="font-medium text-muted-foreground">
                  {` + ${order.items.length - 1} more`}
                </span>
              ) : null}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{order.reference}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatPaise(orderTotalPaise(order))}
            </p>
          </div>
        </div>

        <StatusNotes order={order} />

        <OrderContactCard order={order} showContact={showContact} canChat={canChat} />

        <Section>
          <OrderInfoRows order={order} />
        </Section>

        <TimelineSection order={order} />

        {hasMultipleItems ? (
          <Section>
            <OrderItemsList items={order.items} />
          </Section>
        ) : null}

        <BookingRefundSection order={order} />
        <BookingReviewCard order={order} onWriteReview={onWriteReview} />

        {order.reviewSubmitted ? (
          <p className="text-center text-sm text-muted-foreground">
            Thanks, your review is on its way to our community.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Mobile web booking details. While the decorator is on the way, shows the user app's
 * map-first tracking layout; otherwise the user app's standard order details screen.
 */
export function BookingDetailMobile({ order, showContact, canChat, onWriteReview }) {
  if (isLiveTripOrder(order)) {
    return <TrackingLayout order={order} showContact={showContact} canChat={canChat} />;
  }
  return (
    <StandardLayout
      order={order}
      showContact={showContact}
      canChat={canChat}
      onWriteReview={onWriteReview}
    />
  );
}

