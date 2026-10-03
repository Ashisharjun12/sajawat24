import { CalendarClockIcon, CreditCardIcon, MapPinIcon, WalletIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatPaise } from "@/lib/money"
import { formatBookingSlot, formatPaymentMethod } from "@/module/bookings/lib/booking-format"

const TILE_STYLES = {
  slot: {
    icon: CalendarClockIcon,
    iconClass: "text-blue-600 dark:text-blue-400",
    wellClass: "bg-blue-500/10",
  },
  address: {
    icon: MapPinIcon,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    wellClass: "bg-emerald-500/10",
  },
  payment: {
    icon: null,
    iconClass: "",
    wellClass: "",
  },
}

function ScheduleTile({ variant, label, value, subValue, paymentMethod }) {
  const styles = TILE_STYLES[variant]
  const PaymentIcon =
    paymentMethod === "COD" || paymentMethod === "PREPAID"
      ? WalletIcon
      : paymentMethod === "ONLINE"
        ? CreditCardIcon
        : WalletIcon
  const Icon = variant === "payment" ? PaymentIcon : styles.icon
  const iconClass =
    variant === "payment"
      ? paymentMethod === "COD"
        ? "text-amber-600 dark:text-amber-400"
        : paymentMethod === "PREPAID"
          ? "text-emerald-600 dark:text-emerald-400"
          : paymentMethod === "ONLINE"
            ? "text-violet-600 dark:text-violet-400"
            : "text-muted-foreground"
      : styles.iconClass
  const wellClass =
    variant === "payment"
      ? paymentMethod === "COD"
        ? "bg-amber-500/10"
        : paymentMethod === "PREPAID"
          ? "bg-emerald-500/10"
          : paymentMethod === "ONLINE"
            ? "bg-violet-500/10"
            : "bg-muted/60"
      : styles.wellClass

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            wellClass,
          )}
        >
          <Icon className={cn("size-4", iconClass)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-medium">{value}</p>
          {subValue ? (
            <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{subValue}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function BookingScheduleCard({ order }) {
  const deliveryLine = [order.delivery?.cityName, order.delivery?.pincode]
    .filter(Boolean)
    .join(" · ")

  const addressParts = [
    order.delivery?.address,
    order.delivery?.landmark ? `Landmark: ${order.delivery.landmark}` : null,
  ].filter(Boolean)

  const paymentLabel = formatPaymentMethod(order.paymentMethod)
  const paymentValue = `₹${formatPaise(order.subtotalPaise)}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schedule & delivery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <ScheduleTile
            variant="slot"
            label="Setup slot"
            value={formatBookingSlot(order.scheduledAt)}
          />
          <ScheduleTile
            variant="address"
            label="Delivery address"
            value={deliveryLine || "—"}
            subValue={addressParts.join("\n") || undefined}
          />
          <ScheduleTile
            variant="payment"
            label="Payment"
            value={paymentLabel}
            subValue={paymentValue}
            paymentMethod={order.paymentMethod}
          />
        </div>
      </CardContent>
    </Card>
  )
}
