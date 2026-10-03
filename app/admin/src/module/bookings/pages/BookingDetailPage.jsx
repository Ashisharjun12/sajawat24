import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { UserCheckIcon, UserPlusIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { getBooking } from "@/api/bookings.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignVendorDialog } from "@/module/bookings/components/AssignVendorDialog"
import { BookingAssigneeCard } from "@/module/bookings/components/BookingAssigneeCard"
import { BookingCustomerCard } from "@/module/bookings/components/BookingCustomerCard"
import { BookingDetailSkeleton } from "@/module/bookings/components/BookingDetailSkeleton"
import { BookingDeliveryStatusCard } from "@/module/bookings/components/BookingDeliveryStatusCard"
import { BookingItemsTable } from "@/module/bookings/components/BookingItemsTable"
import { BookingScheduleCard } from "@/module/bookings/components/BookingScheduleCard"
import { BookingPaymentCard } from "@/module/bookings/components/BookingPaymentCard"
import { RefundRequestCard } from "@/module/bookings/components/RefundRequestCard"
import { BookingStatusBadge } from "@/module/bookings/components/BookingStatusBadge"
import { BookingInstantDispatchCard } from "@/module/bookings/components/BookingInstantDispatchCard"
import {
  dispatchStatusLabel,
  dispatchStatusVariant,
  fulfillmentTypeLabel,
} from "@/module/bookings/lib/instant-dispatch-ui"

function canAssign(status) {
  return status === "CONFIRMED" || status === "ASSIGNED"
}

function assignButtonLabel(order) {
  if (!order?.assignee) return "Assign vendor"
  if (order.assignee.vendorResponse === "pending") return "Change vendor"
  if (order.assignee.vendorResponse === "accepted") return "Reassign"
  return "Assign vendor"
}

export function BookingDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [assignOpen, setAssignOpen] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setStatus("error")
      setError("Missing booking reference")
      return undefined
    }

    let cancelled = false
    setStatus("loading")
    void getBooking(orderId)
      .then((data) => {
        if (cancelled) return
        setOrder(data)
        setStatus("ready")
      })
      .catch((err) => {
        if (cancelled) return
        setError(getApiError(err))
        setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [orderId])

  if (status === "loading") {
    return <BookingDetailSkeleton />
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
            <Button render={<Link to="/bookings" />}>Back to bookings</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const showAssign = canAssign(order.status)

  return (
    <div className="w-full max-w-none space-y-6">
      <header className="sticky top-0 z-10 -mx-4 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6">
        <div>
          <Link
            to="/bookings"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Bookings
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-medium tracking-tight">{order.reference}</h1>
            <BookingStatusBadge status={order.status} />
            {order.isCustomPackage ? (
              <Badge variant="secondary">Custom package</Badge>
            ) : null}
            {order.fulfillmentType === "instant" ? (
              <Badge variant="outline">{fulfillmentTypeLabel(order.fulfillmentType)}</Badge>
            ) : null}
            {order.fulfillmentType === "instant" && order.dispatchStatus ? (
              <Badge variant={dispatchStatusVariant(order.dispatchStatus)}>
                {dispatchStatusLabel(order.dispatchStatus)}
              </Badge>
            ) : null}
          </div>
        </div>
        {showAssign ? (
          <Button
            type="button"
            variant={order.status === "ASSIGNED" ? "outline" : "default"}
            onClick={() => setAssignOpen(true)}
          >
            {order.assignee?.vendorResponse === "accepted" ? (
              <>
                <UserCheckIcon className="size-4" />
                {assignButtonLabel(order)}
              </>
            ) : (
              <>
                <UserPlusIcon className="size-4" />
                {assignButtonLabel(order)}
              </>
            )}
          </Button>
        ) : null}
      </header>

      <AssignVendorDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        order={order}
        onAssigned={(updated) => setOrder(updated)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingCustomerCard customer={order.customer} customerId={order.userId} />
        <BookingAssigneeCard
          assignee={order.assignee}
          cityName={order.delivery?.cityName}
          canAssign={showAssign}
          onAssign={() => setAssignOpen(true)}
        />
      </div>

      <BookingScheduleCard order={order} />

      <BookingInstantDispatchCard order={order} />

      <BookingDeliveryStatusCard order={order} />

      <BookingItemsTable items={order.items} subtotalPaise={order.subtotalPaise} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingPaymentCard orderId={order.id} />
        <RefundRequestCard orderId={order.id} />
      </div>
    </div>
  )
}
