import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  formatPaymentLabel,
  formatSetupSlot,
} from "@/module/booking/lib/order-confirmation-format";

const valueClass = "text-sm font-semibold text-foreground";

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4 sm:py-3.5">
      <dt className="text-sm font-semibold text-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export function OrderConfirmationHero({ order }) {
  const customer = order.customer ?? {};
  const delivery = order.delivery ?? {};
  const cityLine = [delivery.cityName, delivery.pincode].filter(Boolean).join(" · ");
  const name = customer.name?.trim() || "—";
  const phone = customer.phone?.trim() || "—";
  const email = customer.email?.trim() || "—";

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Booking confirmed
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          We&apos;ll assign a decorator for your setup slot and notify you by SMS or email when
          things move forward.
        </p>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">Setup &amp; delivery</h2>
        <dl className="mt-3">
          <DetailRow label="Name">
            <span className={valueClass}>{name}</span>
          </DetailRow>
          <DetailRow label="Phone">
            <span className={`${valueClass} tabular-nums`}>{phone}</span>
          </DetailRow>
          <DetailRow label="Email">
            <span className={valueClass}>{email}</span>
          </DetailRow>
          <DetailRow label="Address">
            <span className={`${valueClass} whitespace-pre-wrap leading-snug`}>
              {delivery.address?.trim() || "—"}
            </span>
          </DetailRow>
          {delivery.landmark ? (
            <DetailRow label="Landmark">
              <span className={valueClass}>{delivery.landmark}</span>
            </DetailRow>
          ) : null}
          <DetailRow label="City">
            <span className={valueClass}>{cityLine || "—"}</span>
          </DetailRow>
          <DetailRow label="Setup slot">
            <span className={valueClass}>{formatSetupSlot(order.scheduledAt)}</span>
          </DetailRow>
          <DetailRow label="Payment">
            <span className={valueClass}>{formatPaymentLabel(order.paymentMethod)}</span>
          </DetailRow>
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to={`/account/bookings/${order.id}`}>View booking</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link to="/">Continue shopping</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="rounded-full">
          <Link to="/decorations">Browse decorations</Link>
        </Button>
      </div>
    </div>
  );
}
