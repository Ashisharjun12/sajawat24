import { useEffect, useMemo, useState } from "react"
import { useWatch } from "react-hook-form"
import { getPayoutPolicy } from "@/api/settings.api"
import { formatPaise } from "@/lib/money"
import { formatInr } from "@/module/payouts/lib/payout-format"
import {
  formatBookingDate,
  formatBookingTime,
  formatCreateBookingPaymentMethod,
} from "@/module/bookings/lib/booking-format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingPreviewThumb } from "@/module/bookings/components/BookingPreviewThumb"
import { PackageAddonPrice } from "@/module/bookings/package-picker/PackageAddonPrice"
import { PackageProductPrice } from "@/module/bookings/package-picker/PackageProductPrice"

function SummaryRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  )
}

export function CreateBookingSummary({
  form,
  orderSelection,
  preview,
  cityName,
}) {
  const orderKind = useWatch({ control: form.control, name: "orderKind" }) ?? "catalog"
  const customer = useWatch({ control: form.control, name: "customer" })
  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" })
  const scheduledAt = useWatch({ control: form.control, name: "scheduledAt" })
  const customName = useWatch({ control: form.control, name: "customName" })
  const customPriceRupees = useWatch({ control: form.control, name: "customPriceRupees" })
  const customImagePreviewUrl = useWatch({ control: form.control, name: "customImagePreviewUrl" })

  const customerName = customer?.name ?? ""
  const customerPhone = customer?.phone ?? ""
  const [commissionPercent, setCommissionPercent] = useState(null)

  const isCustom = orderKind === "custom"

  const customTotalPaise = useMemo(() => {
    const rupees = Number(customPriceRupees)
    if (!Number.isFinite(rupees) || rupees <= 0) return null
    return Math.round(rupees * 100)
  }, [customPriceRupees])

  const displayTotalPaise = isCustom ? customTotalPaise : preview.totalPaise
  const displayScheduledAt = isCustom ? scheduledAt : orderSelection?.scheduledAt
  const hasPackage = isCustom
    ? Boolean(customName?.trim())
    : Boolean(orderSelection)

  useEffect(() => {
    let cancelled = false
    getPayoutPolicy()
      .then((policy) => {
        if (!cancelled) setCommissionPercent(policy.platformCommissionPercent)
      })
      .catch(() => {
        if (!cancelled) setCommissionPercent(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const splitPreview = useMemo(() => {
    if (displayTotalPaise == null || commissionPercent == null) return null
    const pct = Math.min(50, Math.max(0, Math.round(commissionPercent)))
    const platformFee = Math.floor((displayTotalPaise * pct) / 100)
    const vendorShare = displayTotalPaise - platformFee
    return { pct, platformFee, vendorShare }
  }, [commissionPercent, displayTotalPaise])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SummaryRow label="Customer">
          <span className="font-medium">{customerName?.trim() || "—"}</span>
        </SummaryRow>

        <SummaryRow label="Phone">
          <span className="font-medium tabular-nums">{customerPhone?.trim() || "—"}</span>
        </SummaryRow>

        <SummaryRow label="City">
          <span>{cityName || orderSelection?.cityName || "—"}</span>
        </SummaryRow>

        <SummaryRow label="Date">
          <span className="font-medium">
            {displayScheduledAt ? formatBookingDate(displayScheduledAt) : "—"}
          </span>
        </SummaryRow>

        <SummaryRow label="Time">
          <span className="font-medium">
            {displayScheduledAt ? formatBookingTime(displayScheduledAt) : "—"}
          </span>
        </SummaryRow>

        <div className="space-y-2 border-t pt-3">
          <p className="text-muted-foreground">{isCustom ? "Custom package" : "Package"}</p>
          {!hasPackage ? (
            <p className="text-muted-foreground">—</p>
          ) : isCustom ? (
            <div className="flex items-start gap-3">
              {customImagePreviewUrl ? (
                <BookingPreviewThumb src={customImagePreviewUrl} alt={customName} />
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium leading-snug">{customName?.trim() || "—"}</p>
                {customTotalPaise != null ? (
                  <p className="tabular-nums font-medium">₹{formatPaise(customTotalPaise)}</p>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            </div>
          ) : preview.loading && !preview.coverUrl ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <BookingPreviewThumb src={preview.coverUrl} alt={preview.productName} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium leading-snug">
                  {preview.productName || orderSelection.productName || "—"}
                </p>
                <PackageProductPrice
                  compact
                  pricePaise={preview.price?.pricePaise ?? null}
                  compareAtPaise={preview.price?.compareAtPaise ?? null}
                  cityName={cityName || orderSelection.cityName}
                />
              </div>
            </div>
          )}
        </div>

        {!isCustom && orderSelection && preview.addons.length > 0 ? (
          <div className="space-y-2 border-t pt-3">
            <p className="text-muted-foreground">Add-ons</p>
            <ul className="space-y-2">
              {preview.addons.map((addon) => (
                <li key={addon.id} className="flex items-center gap-2">
                  <BookingPreviewThumb src={addon.coverUrl} alt={addon.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{addon.name}</p>
                    <PackageAddonPrice
                      pricePaise={addon.pricePaise}
                      compareAtPaise={addon.compareAtPaise}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <SummaryRow label="Payment">
          <span className="font-medium">{formatCreateBookingPaymentMethod(paymentMethod)}</span>
        </SummaryRow>

        {splitPreview ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Estimated split ({splitPreview.pct}% commission)</p>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Platform</span>
              <span className="tabular-nums">{formatInr(splitPreview.platformFee)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Vendor</span>
              <span className="tabular-nums">{formatInr(splitPreview.vendorShare)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethod === "cod"
                ? "Vendor collects at door; platform fee becomes COD due when the job completes."
                : "No COD collection — ledger posts when the job completes."}
            </p>
          </div>
        ) : null}

        <div className="flex justify-between gap-4 border-t pt-2 font-medium">
          <span>Total</span>
          {!isCustom && preview.loading && preview.totalPaise == null ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="tabular-nums">
              {displayTotalPaise != null ? `₹${formatPaise(displayTotalPaise)}` : "—"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
