import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getApiError } from "@/api/api"
import { getCustomer, patchCustomerStatus } from "@/api/customers.api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { formatPaise } from "@/lib/money"
import { CustomerStatusBadge } from "@/module/people/components/CustomerStatusBadge"
import { PersonBookingsPanel } from "@/module/people/components/PersonBookingsPanel"
import { CustomerRefundsPanel } from "@/module/people/components/CustomerRefundsPanel"
import { formatJoinedDate } from "@/module/people/lib/people-format"

function DetailRow({ label, value, mono = false }) {
  const text = value?.trim?.() ? value : value ?? "—"
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{text || "—"}</dd>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [dialog, setDialog] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setStatus("error")
      setError("Missing customer reference")
      return undefined
    }

    let cancelled = false
    setStatus("loading")
    void getCustomer(customerId)
      .then((data) => {
        if (cancelled) return
        setCustomer(data)
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
  }, [customerId])

  async function confirmDialog() {
    if (!dialog || !customer) return
    const nextStatus = dialog === "block" ? "blocked" : "active"
    setSubmitting(true)
    try {
      const updated = await patchCustomerStatus(customer.id, nextStatus)
      setCustomer(updated)
      toast.add({
        title: nextStatus === "blocked" ? `${customer.name} blocked` : `${customer.name} unblocked`,
        type: "success",
      })
      setDialog(null)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (status === "error" || !customer) {
    return (
      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Customer not found</CardTitle>
            <CardDescription>{error || "We couldn’t load this customer."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/people?tab=customers" />}>Back to customers</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <Link
          to="/people?tab=customers"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Customers
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-medium tracking-tight">{customer.name}</h1>
          <CustomerStatusBadge status={customer.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Joined {formatJoinedDate(customer.createdAt)}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {customer.status === "blocked" ? (
          <Button onClick={() => setDialog("unblock")}>Unblock customer</Button>
        ) : (
          <Button variant="destructive" onClick={() => setDialog("block")}>
            Block customer
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate("/people?tab=customers")}>
          Back to list
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings" value={customer.bookingCount ?? 0} />
        <StatCard label="Completed" value={customer.completedCount ?? 0} />
        <StatCard label="Cancelled" value={customer.cancelledCount ?? 0} />
        <StatCard
          label="Lifetime spend"
          value={`₹${formatPaise(customer.totalSpendPaise ?? 0)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <DetailRow label="Phone" value={customer.phone} mono />
            <DetailRow label="Email" value={customer.email} />
            <DetailRow
              label="Last booking"
              value={
                customer.lastBookingAt ? formatJoinedDate(customer.lastBookingAt) : "—"
              }
            />
          </dl>
        </CardContent>
      </Card>

      <PersonBookingsPanel userId={customer.id} title="Bookings" />

      <CustomerRefundsPanel customerId={customer.id} customerName={customer.name} />

      <AlertDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open && !submitting) setDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog === "block" ? "Block this customer?" : "Unblock this customer?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "block"
                ? `${customer.name} will not be able to log in or place new bookings.`
                : `${customer.name} will be able to log in and book again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={dialog === "block" ? "destructive" : "default"}
              disabled={submitting}
              onClick={confirmDialog}
            >
              {submitting ? "Saving…" : dialog === "block" ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
