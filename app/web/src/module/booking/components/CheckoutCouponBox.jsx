import { useEffect, useState } from "react";
import { ChevronRightIcon, TicketPercentIcon, XIcon } from "lucide-react";
import { getApiError } from "@/api/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { buildCouponPreviewFromApplied } from "@/module/booking/lib/coupon-preview";
import {
  couponRequiresCity,
  getCouponPaymentWarning,
} from "@/module/booking/lib/coupon-eligibility";

function CouponIconBadge() {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-black"
      aria-hidden
    >
      <TicketPercentIcon className="size-4" strokeWidth={2.25} />
    </span>
  );
}

export function CheckoutCouponBox({ cart, paymentMethod, className }) {
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const appliedCoupon = cart?.appliedCoupon;
  const needsCity = couponRequiresCity(cart);
  const paymentWarning = getCouponPaymentWarning(appliedCoupon, paymentMethod);
  const preview = appliedCoupon ? buildCouponPreviewFromApplied(appliedCoupon) : null;

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(appliedCoupon?.code ?? "");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appliedCoupon?.code) {
      setCode(appliedCoupon.code);
      setOpen(false);
    }
  }, [appliedCoupon?.code]);

  async function onApply() {
    const trimmed = code.trim();
    if (!trimmed || needsCity) return;

    setApplying(true);
    setError("");
    try {
      await applyCoupon(trimmed);
      setOpen(false);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setApplying(false);
    }
  }

  async function onRemove() {
    setApplying(true);
    setError("");
    try {
      await removeCoupon();
      setCode("");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setApplying(false);
    }
  }

  function onKeyDown(event) {
    if (event.key !== "Enter" || applying || appliedCoupon) return;
    event.preventDefault();
    void onApply();
  }

  if (appliedCoupon) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {paymentWarning ? (
          <Alert variant="destructive" className="rounded-lg py-2.5">
            <AlertDescription className="text-xs leading-relaxed">{paymentWarning}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-center gap-3">
          <CouponIconBadge />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {preview?.discount ?? "Coupon applied"}
            </p>
            <p className="truncate font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {appliedCoupon.code}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            disabled={applying}
            onClick={onRemove}
            aria-label="Remove coupon"
          >
            {applying ? <Spinner className="size-3.5" /> : <XIcon className="size-4" />}
          </Button>
        </div>
        {error ? (
          <Alert variant="destructive" className="rounded-lg py-2.5">
            <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    );
  }

  if (!open) {
    return (
      <div className={cn(className)}>
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80"
          onClick={() => setOpen(true)}
        >
          <CouponIconBadge />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">Apply coupon code</span>
            <span className="text-xs text-muted-foreground">Enter a code to save on this order</span>
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div>
        <div className="mb-2.5 flex items-center gap-2.5">
          <CouponIconBadge />
          <p className="text-xs font-medium text-muted-foreground">Coupon code</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. SAVE10"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              if (error) setError("");
            }}
            onKeyDown={onKeyDown}
            aria-label="Coupon code"
            aria-invalid={Boolean(error)}
            disabled={applying || needsCity}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="h-10 flex-1 rounded-lg border-border/80 bg-background font-mono text-sm font-semibold uppercase tracking-wide"
          />
          <Button
            type="button"
            className="h-10 shrink-0 rounded-lg bg-primary px-4 font-semibold text-black hover:bg-primary/85"
            onClick={onApply}
            disabled={applying || needsCity || !code.trim()}
          >
            {applying ? <Spinner className="size-4" /> : "Apply"}
          </Button>
        </div>
        <Button
          type="button"
          variant="link"
          className="mt-2 h-auto px-0 text-xs text-muted-foreground"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
        >
          Cancel
        </Button>
      </div>

      {needsCity ? (
        <p className="text-xs text-muted-foreground">
          Select your delivery city first to apply a coupon.
        </p>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="rounded-lg py-2.5">
          <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
