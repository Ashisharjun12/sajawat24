import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { formatPaise } from "@/lib/money";
import { checkoutLineTitle } from "@/module/booking/lib/checkout-line-title";
import {
  formatOrderDate,
  formatPaymentLabel,
} from "@/module/booking/lib/order-confirmation-format";

function LinePrice({ pricePaise, className = "text-sm" }) {
  if (!pricePaise) {
    return <span className={`shrink-0 font-medium text-foreground ${className}`}>Free</span>;
  }
  return (
    <span
      className={`shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 ${className}`}
    >
      {formatPaise(pricePaise)}
    </span>
  );
}

export function OrderConfirmationReceipt({ order }) {
  const items = order.items ?? [];
  const subtotal = order.subtotalPaise ?? 0;
  const discount = order.discountPaise ?? 0;
  const total = order.totalPaise ?? subtotal - discount;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <h2 className="font-heading text-lg font-semibold tracking-tight">Order summary</h2>

      <div className="grid grid-cols-3 gap-2 border-y border-border/50 py-4 text-xs sm:text-sm">
        <div className="border-r border-border/50 pr-2">
          <p className="font-semibold text-foreground">Date</p>
          <p className="mt-1 text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
        </div>
        <div className="border-r border-border/50 px-2">
          <p className="font-semibold text-foreground">Booking</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground sm:text-xs">
            {order.reference}
          </p>
        </div>
        <div className="pl-2">
          <p className="font-semibold text-foreground">Payment</p>
          <p className="mt-1 text-muted-foreground">{formatPaymentLabel(order.paymentMethod)}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-5 border-b border-border/50 pb-5">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <DecoryImageFallback />
                )}
              </span>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="whitespace-pre-line text-sm font-medium leading-snug text-foreground">
                    {checkoutLineTitle(item.name)}
                  </p>
                  {item.quantity > 1 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">Qty {item.quantity}</p>
                  ) : null}
                </div>
                <LinePrice pricePaise={item.lineTotalPaise} />
              </div>
            </div>
            {item.addons?.length ? (
              <ul className="flex flex-col gap-2.5 pl-1">
                {item.addons.map((addon) => (
                  <li key={addon.id} className="flex items-start gap-2.5">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {addon.imageUrl ? (
                        <img src={addon.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <DecoryImageFallback className="size-full text-[10px]" />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                      <p className="min-w-0 whitespace-pre-line text-xs leading-snug text-muted-foreground">
                        {checkoutLineTitle(addon.name)}
                        {addon.quantity > 1 ? ` × ${addon.quantity}` : ""}
                      </p>
                      <LinePrice pricePaise={addon.pricePaise} className="text-xs" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Subtotal</span>
          <span className="tabular-nums text-foreground">{formatPaise(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Setup &amp; delivery</span>
          <span className="font-semibold text-foreground">Included</span>
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">
              Discount{order.couponCode ? ` (${order.couponCode})` : ""}
            </span>
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              −{formatPaise(discount)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-base font-bold text-foreground">Order total</span>
          <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatPaise(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
