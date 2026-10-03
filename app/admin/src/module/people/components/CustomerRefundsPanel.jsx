import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefundRequestsPanel } from "@/module/payouts/components/RefundRequestsPanel"

export function CustomerRefundsPanel({ customerId, customerName }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund requests</CardTitle>
        <CardDescription>
          Refunds requested by {customerName ?? "this customer"} for cancelled or disputed bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RefundRequestsPanel userId={customerId} showCustomer={false} />
      </CardContent>
    </Card>
  )
}
