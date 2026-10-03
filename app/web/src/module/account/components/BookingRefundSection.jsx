import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "@/api/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useOrderRefundQuery, useRefundMutations } from "@/module/account/hooks/use-refunds-query";
import {
  canRequestRefund,
  formatPaise,
  REFUND_STATUS_LABELS,
  refundStatusVariant,
} from "@/module/account/lib/refund-ui";

export function BookingRefundSection({ order }) {
  const { data: refund, isLoading } = useOrderRefundQuery(order?.id, { enabled: Boolean(order?.id) });
  const { create } = useRefundMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  const eligible = canRequestRefund(order, refund);
  const showSection =
    order?.status === "CANCELLED" || order?.status === "DISPUTED" || refund;

  if (!showSection) return null;

  async function onSubmit(event) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      toast.add({ title: "Please describe your refund request (at least 10 characters)", type: "error" });
      return;
    }
    try {
      await create.mutateAsync({ orderId: order.id, reason: trimmed });
      setDialogOpen(false);
      setReason("");
      toast.add({ title: "Refund request submitted", type: "success" });
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    }
  }

  return (
    <>
      <Card className="shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-lg">Refund</CardTitle>
          <CardDescription>
            Request a refund for this cancelled or disputed booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Loading refund status…
            </div>
          ) : null}
          {!isLoading && refund ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={refundStatusVariant(refund.status)}>
                  {REFUND_STATUS_LABELS[refund.status] ?? refund.status}
                </Badge>
                <span className="text-sm font-semibold tabular-nums">{formatPaise(refund.amountPaise)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{refund.reason}</p>
              <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
                <Link to="/account/returns">View all refunds</Link>
              </Button>
            </div>
          ) : null}
          {!isLoading && eligible ? (
            <Button type="button" onClick={() => setDialogOpen(true)}>Request refund</Button>
          ) : null}
          {!isLoading && !eligible && !refund ? (
            <p className="text-sm text-muted-foreground">
              Refunds are available after a booking is cancelled or disputed.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request refund</DialogTitle>
            <DialogDescription>
              We will review your request and process eligible refunds to your original payment method.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
            <Field>
              <FieldLabel htmlFor="refund-reason">Reason</FieldLabel>
              <Textarea
                id="refund-reason"
                placeholder="Tell us why you are requesting a refund…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </Field>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Spinner className="size-4" /> : "Submit request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
