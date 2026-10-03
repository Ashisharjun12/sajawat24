import { format } from "date-fns"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { clipText } from "@/module/bookings/lib/booking-format"
import { formatInr } from "@/module/payouts/lib/payout-format"
import { REFUND_STATUS_LABELS, refundStatusVariant } from "@/module/payouts/lib/refund-format"

const SKELETON_ROWS = 8

function formatDate(iso) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "MMM d, yyyy")
  } catch {
    return "—"
  }
}

export function RefundRequestsTable({
  items,
  loading,
  actingId,
  onAction,
  showCustomer = true,
}) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return null
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requested</TableHead>
            {showCustomer ? <TableHead>Customer</TableHead> : null}
            <TableHead>Booking</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="min-w-[12rem]">Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.requestedAt)}
              </TableCell>
              {showCustomer ? (
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto justify-start p-0 text-left font-medium"
                      onClick={() => navigate(`/people/customers/${row.userId}`)}
                    >
                      {clipText(row.customerName ?? "Customer", 22)}
                    </Button>
                    {row.customerPhone ? (
                      <span className="text-xs text-muted-foreground">{row.customerPhone}</span>
                    ) : null}
                  </div>
                </TableCell>
              ) : null}
              <TableCell>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 font-mono text-xs"
                  onClick={() => navigate(`/bookings/${row.orderId}`)}
                >
                  {row.orderRef}
                </Button>
              </TableCell>
              <TableCell title={row.productName}>
                {clipText(row.productName, 28)}
              </TableCell>
              <TableCell className="tabular-nums whitespace-nowrap">
                {formatInr(row.amountPaise)}
                <span className="ml-1 text-xs text-muted-foreground">{row.paymentMethod}</span>
              </TableCell>
              <TableCell>
                <Badge variant={refundStatusVariant(row.status)}>
                  {REFUND_STATUS_LABELS[row.status] ?? row.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[14rem] text-sm text-muted-foreground">
                <span title={row.reason}>{clipText(row.reason, 48)}</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/bookings/${row.orderId}`}>Booking</Link>
                  </Button>
                  {row.status === "requested" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={actingId === row.id}
                        onClick={() => onAction(row.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={actingId === row.id}
                        onClick={() => onAction(row.id, "reject")}
                      >
                        Decline
                      </Button>
                    </>
                  ) : null}
                  {row.status === "processing" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={actingId === row.id}
                      onClick={() => onAction(row.id, "complete")}
                    >
                      Complete
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
