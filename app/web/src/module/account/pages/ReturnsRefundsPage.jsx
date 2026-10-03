import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { getApiError } from "@/api/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { AccountPageTitle } from "@/module/account/components/AccountPageTitle";
import { AddressListSkeleton } from "@/module/account/components/AddressListSkeleton";
import { useRefundsQuery } from "@/module/account/hooks/use-refunds-query";
import {
  formatPaise,
  REFUND_STATUS_LABELS,
  refundStatusVariant,
  summarizeRefunds,
} from "@/module/account/lib/refund-ui";
import { getHelpTopic } from "@/module/chat/lib/help-topics";

const paymentTopic = getHelpTopic("payment");

function formatRefundDate(iso) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export function ReturnsRefundsPage() {
  const { data: refunds = [], isLoading, isError, error } = useRefundsQuery();

  const { completedPaise, pendingPaise } = useMemo(
    () => summarizeRefunds(refunds),
    [refunds],
  );

  return (
    <div className="w-full max-w-3xl">
      <AccountPageTitle>Refunds</AccountPageTitle>
      <p className="mt-2 text-sm text-muted-foreground">
        Track refund requests for cancelled or disputed bookings.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border/70 bg-background px-3.5 py-3">
          <p className="text-xs font-medium text-muted-foreground">Refunded</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatPaise(completedPaise)}
          </p>
        </div>
        <div className="rounded-md border border-border/70 bg-background px-3.5 py-3">
          <p className="text-xs font-medium text-muted-foreground">In progress</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatPaise(pendingPaise)}
          </p>
        </div>
      </div>

      {isLoading ? <AddressListSkeleton count={2} className="mt-8" /> : null}

      {isError ? (
        <p className="mt-6 text-sm text-destructive">{getApiError(error)}</p>
      ) : null}

      {!isLoading && !isError && refunds.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No refund requests yet.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/account/bookings">View my orders</Link>
          </Button>
        </div>
      ) : null}

      {!isLoading && refunds.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">Refund activity</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {refunds.map((row) => (
              <li
                key={row.id}
                className="flex gap-3 rounded-md border border-border/70 bg-card p-3"
              >
                <span className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {row.imageUrl ? (
                    <img src={row.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <DecoryImageFallback className="size-full" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-heading text-sm font-semibold leading-snug">
                      {row.productName}
                    </p>
                    <Badge variant={refundStatusVariant(row.status)}>
                      {REFUND_STATUS_LABELS[row.status] ?? row.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Order {row.orderRef}</p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                    {formatPaise(row.amountPaise)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested {formatRefundDate(row.requestedAt)}
                    {row.completedAt
                      ? ` · Completed ${formatRefundDate(row.completedAt)}`
                      : null}
                  </p>
                  {row.orderId ? (
                    <Button variant="link" className="mt-1 h-auto px-0 text-xs" asChild>
                      <Link to={`/account/bookings/${row.orderId}`}>View order</Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 space-y-3 rounded-md border border-border/70 bg-muted/20 px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground">Need help?</h2>
        <p className="text-sm text-muted-foreground">
          {paymentTopic?.description ?? "COD, online payment, or refund status."}
        </p>
        <Button asChild className="rounded-lg px-4">
          <Link to="/account/help/payment/chat">Chat about payment &amp; refunds</Link>
        </Button>
      </section>
    </div>
  );
}
