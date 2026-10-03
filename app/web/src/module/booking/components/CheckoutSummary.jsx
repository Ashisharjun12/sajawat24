import { formatPaise } from "@/lib/money";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { Button } from "@/components/ui/button";
import { CheckoutCouponBox } from "@/module/booking/components/CheckoutCouponBox";
import { checkoutLineTitle } from "@/module/booking/lib/checkout-line-title";
import { useCartStore } from "@/store/cart.store";

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

export function CheckoutSummary({ cart, paymentMethod }) {
  const setCartOpen = useCartStore((s) => s.setOpen);
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalPaise ?? 0;
  const discount = cart?.discountPaise ?? 0;
  const total = cart?.totalPaise ?? subtotal;
  const appliedCoupon = cart?.appliedCoupon;

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Order summary</h2>
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-sm text-muted-foreground"
          onClick={() => setCartOpen(true)}
        >
          Edit cart
        </Button>
      </div>

      <ul className="flex flex-col gap-5 border-b border-border/60 pb-4">
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
                <p className="whitespace-pre-line text-sm font-medium leading-snug text-foreground">
                  {checkoutLineTitle(item.name)}
                </p>
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
                      <p className="whitespace-pre-line text-xs leading-snug text-muted-foreground">
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

      <CheckoutCouponBox
        cart={cart}
        paymentMethod={paymentMethod}
        className="border-b border-border/60 py-4"
      />

      <div className="flex flex-col gap-2.5 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Shipping</span>
          <span className="font-medium text-foreground">Free</span>
        </div>

        {discount > 0 ? (
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">
              Sale{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ""}
            </span>
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              −{formatPaise(discount)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-base font-bold text-foreground">Subtotal</span>
          <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatPaise(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
