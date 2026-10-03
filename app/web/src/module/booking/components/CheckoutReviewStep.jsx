import { format } from "date-fns";
import { formatPaise } from "@/lib/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCouponPaymentWarning } from "@/module/booking/lib/coupon-eligibility";

function formatSlot(iso) {
  if (!iso) return "Not set — we’ll confirm a slot";
  try {
    return format(new Date(iso), "EEE d MMM, h a");
  } catch {
    return "Not set — we’ll confirm a slot";
  }
}

export function CheckoutReviewStep({
  customer,
  delivery,
  payment,
  scheduledAt,
  subtotalPaise,
  discountPaise = 0,
  totalPaise,
  appliedCoupon,
  onPlace,
  placing,
}) {
  const payLabel = payment === "cod" ? "Cash on delivery" : "Pay online";
  const subtotal = subtotalPaise ?? 0;
  const discount = discountPaise ?? 0;
  const total = totalPaise ?? subtotal;
  const paymentWarning = getCouponPaymentWarning(appliedCoupon, payment);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="font-medium">{customer.name}</dd>
          <dd className="text-muted-foreground">{customer.phone}</dd>
          <dd className="text-muted-foreground">{customer.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="font-medium">
            {delivery.cityName ? `${delivery.cityName} · ${delivery.pincode}` : delivery.pincode}
          </dd>
          <dd className="whitespace-pre-wrap text-muted-foreground">{delivery.address}</dd>
          {delivery.landmark ? (
            <dd className="text-muted-foreground">Landmark: {delivery.landmark}</dd>
          ) : null}
        </div>
        <div>
          <dt className="text-muted-foreground">Setup slot</dt>
          <dd className="font-medium">{formatSlot(scheduledAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="font-medium">{payLabel}</dd>
        </div>
        {appliedCoupon ? (
          <div>
            <dt className="text-muted-foreground">Coupon</dt>
            <dd className="font-medium font-mono uppercase tracking-wide">{appliedCoupon.code}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">Order total</dt>
          <dd className="space-y-1">
            {discount > 0 ? (
              <p className="text-muted-foreground tabular-nums">
                Subtotal {formatPaise(subtotal)}
              </p>
            ) : null}
            {discount > 0 ? (
              <p className="text-emerald-700 tabular-nums dark:text-emerald-400">
                Discount −{formatPaise(discount)}
              </p>
            ) : null}
            <p className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatPaise(total)}
            </p>
          </dd>
        </div>
      </dl>

      {paymentWarning ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription className="text-sm">{paymentWarning}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        size="lg"
        disabled={placing || Boolean(paymentWarning)}
        onClick={onPlace}
      >
        {placing ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-pulse rounded-md bg-primary-foreground/40" aria-hidden />
            Placing booking…
          </span>
        ) : (
          "Place booking"
        )}
      </Button>
    </div>
  );
}
