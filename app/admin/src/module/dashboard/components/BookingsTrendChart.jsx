import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatInr } from "@/module/payouts/lib/payout-format"

const chartConfig = {
  bookings: { label: "Bookings" },
  jan: { label: "Jan", color: "var(--chart-2)" },
  feb: { label: "Feb", color: "var(--chart-1)" },
  mar: { label: "Mar", color: "var(--chart-3)" },
  apr: { label: "Apr", color: "var(--chart-4)" },
  may: { label: "May", color: "var(--chart-2)" },
  jun: { label: "Jun", color: "var(--chart-1)" },
  jul: { label: "Jul", color: "var(--chart-3)" },
  aug: { label: "Aug", color: "var(--chart-4)" },
  sep: { label: "Sep", color: "var(--chart-2)" },
  oct: { label: "Oct", color: "var(--chart-1)" },
  nov: { label: "Nov", color: "var(--chart-3)" },
  dec: { label: "Dec", color: "var(--chart-4)" },
}

const BAR_COLORS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
]

export function BookingsTrendChart({ items = [], loading }) {
  if (loading) {
    return (
      <Card className="min-w-0 flex-1">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = items.map((row) => ({
    month: row.month,
    bookings: row.bookings,
    revenuePaise: row.revenuePaise,
  }))

  return (
    <Card className="min-w-0 flex-1">
      <CardHeader>
        <CardTitle>Booking volume</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-40 gap-2.5"
                  formatter={(value) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-muted-foreground">Bookings</span>
                      <span className="text-foreground font-semibold tabular-nums">
                        {Number(value).toLocaleString()}
                      </span>
                    </div>
                  )}
                  labelFormatter={(value, payload) => {
                    const revenuePaise = payload?.[0]?.payload?.revenuePaise ?? 0
                    return (
                      <div className="border-border/50 mb-0.5 flex flex-col gap-0.5 border-b pb-2">
                        <span className="text-xs font-medium">{value}</span>
                        <span className="text-xs text-muted-foreground">
                          Revenue {formatInr(revenuePaise)}
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Bar dataKey="bookings" radius={4}>
              {chartData.map((row, index) => (
                <Cell key={row.month} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
