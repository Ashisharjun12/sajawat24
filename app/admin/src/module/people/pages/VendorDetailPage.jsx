import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { getApiError } from "@/api/api"
import { getVendor, patchVendorStatus } from "@/api/vendors.api"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { PersonBookingsPanel } from "@/module/people/components/PersonBookingsPanel"
import { VendorStatusBadge } from "@/module/people/components/VendorStatusBadge"
import { VendorWalletCard } from "@/module/people/components/VendorWalletCard"
import { VendorWorkersPanel } from "@/module/people/components/VendorWorkersPanel"
import { formatJoinedDate } from "@/module/people/lib/people-format"

const DIALOG_COPY = {
  approve: {
    title: "Approve this vendor?",
    description: (name) =>
      `${name} will become active and can be assigned to bookings.`,
    action: "Approve",
    destructive: false,
    status: "ACTIVE",
  },
  reject: {
    title: "Reject this vendor?",
    description: (name) =>
      `${name} will not be able to receive assignments unless approved later.`,
    action: "Reject",
    destructive: true,
    status: "REJECTED",
  },
  block: {
    title: "Block this vendor?",
    description: (name) => `${name} will be blocked from receiving new assignments.`,
    action: "Block",
    destructive: true,
    status: "BLOCKED",
  },
}

const VENDOR_TABS = ["overview", "workers"]

function normalizeVendorTab(value) {
  return VENDOR_TABS.includes(value) ? value : "overview"
}

function DetailRow({ label, value, mono = false }) {
  const text = value?.trim?.() ? value : value ?? "—"
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{text || "—"}</dd>
    </div>
  )
}

export function VendorDetailPage() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = normalizeVendorTab(searchParams.get("tab"))
  const [vendor, setVendor] = useState(null)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [dialog, setDialog] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function onTabChange(next) {
    setSearchParams({ tab: next }, { replace: true })
  }

  useEffect(() => {
    if (!vendorId) {
      setStatus("error")
      setError("Missing vendor reference")
      return undefined
    }

    let cancelled = false
    setStatus("loading")
    void getVendor(vendorId)
      .then((data) => {
        if (cancelled) return
        setVendor(data)
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
  }, [vendorId])

  useEffect(() => {
    if (vendor?.onboardingStatus !== "ACTIVE" && tab === "workers") {
      setSearchParams({ tab: "overview" }, { replace: true })
    }
  }, [vendor?.onboardingStatus, tab, setSearchParams])

  async function confirmDialog() {
    if (!dialog || !vendor) return
    const copy = DIALOG_COPY[dialog]
    setSubmitting(true)
    try {
      const updated = await patchVendorStatus(vendor.id, copy.status)
      setVendor((row) => ({ ...row, ...updated }))
      toast.add({ title: `${vendor.name} ${copy.action.toLowerCase()}d`, type: "success" })
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

  if (status === "error" || !vendor) {
    return (
      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Vendor not found</CardTitle>
            <CardDescription>{error || "We couldn’t load this vendor."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/people?tab=vendors" />}>Back to vendors</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeDialog = dialog ? DIALOG_COPY[dialog] : null
  const location = [vendor.cityName, vendor.state].filter(Boolean).join(", ")
  const showWorkersTab = vendor.onboardingStatus === "ACTIVE"

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <Link
          to="/people?tab=vendors"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Vendors
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-medium tracking-tight">{vendor.name}</h1>
          <VendorStatusBadge status={vendor.onboardingStatus} />
          {vendor.onboardingStatus === "ACTIVE" ? (
            <Badge
              className={
                vendor.isOnDuty
                  ? "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                  : undefined
              }
              variant={vendor.isOnDuty ? "default" : "secondary"}
            >
              {vendor.isOnDuty ? "Online" : "Offline"}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Applied {formatJoinedDate(vendor.createdAt)}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {vendor.onboardingStatus === "PENDING" ? (
          <>
            <Button onClick={() => setDialog("approve")}>Approve</Button>
            <Button variant="outline" onClick={() => setDialog("reject")}>
              Reject
            </Button>
          </>
        ) : null}
        {vendor.onboardingStatus === "ACTIVE" ? (
          <Button variant="destructive" onClick={() => setDialog("block")}>
            Block vendor
          </Button>
        ) : null}
        {vendor.onboardingStatus === "REJECTED" ? (
          <Button onClick={() => setDialog("approve")}>Approve</Button>
        ) : null}
        {vendor.onboardingStatus === "BLOCKED" ? (
          <Button onClick={() => setDialog("approve")}>Reactivate</Button>
        ) : null}
        <Button variant="ghost" onClick={() => navigate("/people?tab=vendors")}>
          Back to list
        </Button>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showWorkersTab ? <TabsTrigger value="workers">Workers</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {vendor.onboardingStatus === "ACTIVE" ? <VendorWalletCard vendorId={vendor.id} /> : null}

          <Card>
            <CardHeader>
              <CardTitle>Registration details</CardTitle>
              <CardDescription>Information submitted during vendor onboarding.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <DetailRow label="Name" value={vendor.name} />
                <DetailRow label="Email" value={vendor.email} />
                <DetailRow label="Phone" value={vendor.phone} mono />
                <DetailRow label="Alt. phone" value={vendor.altPhone} mono />
                <DetailRow label="City" value={location} />
                <DetailRow label="Shop address" value={vendor.shopAddress} />
                <DetailRow label="Pincode" value={vendor.pincode} mono />
                {vendor.onboardingStatus === "ACTIVE" ? (
                  <>
                    <DetailRow
                      label="Duty status"
                      value={vendor.isOnDuty ? "Online" : "Offline"}
                    />
                    <DetailRow
                      label="Last duty change"
                      value={
                        vendor.dutyChangedAt ? formatJoinedDate(vendor.dutyChangedAt) : "—"
                      }
                    />
                  </>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          {vendor.shopImageUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>Shop photo</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={vendor.shopImageUrl}
                  alt={`${vendor.name} shop`}
                  className="max-h-80 w-full rounded-lg border object-cover object-center"
                />
              </CardContent>
            </Card>
          ) : null}

          <PersonBookingsPanel vendorId={vendor.id} title="Assigned bookings" />
        </TabsContent>

        {showWorkersTab ? (
          <TabsContent value="workers">
            <Card>
              <CardHeader>
                <CardTitle>Field workers</CardTitle>
                <CardDescription>
                  Workers invited by this shop owner in the partner app (read-only).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VendorWorkersPanel vendorId={vendor.id} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <AlertDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open && !submitting) setDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{activeDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {activeDialog ? activeDialog.description(vendor.name) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={activeDialog?.destructive ? "destructive" : "default"}
              disabled={submitting}
              onClick={confirmDialog}
            >
              {submitting ? "Saving…" : activeDialog?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
