import { Label, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  count: { label: "Bookings" },
  completed: { label: "Completed", color: "var(--chart-1)" },
  inProgress: { label: "In progress", color: "var(--chart-2)" },
  needsAssign: { label: "Needs assign", color: "var(--chart-3)" },
  pending: { label: "Pending", color: "var(--chart-4)" },
  cancelled: { label: "Cancelled", color: "var(--chart-5)" },
}

const STATUS_COLORS = {
  completed: "var(--chart-1)",
  inProgress: "var(--chart-2)",
  needsAssign: "var(--chart-3)",
  pending: "var(--chart-4)",
  cancelled: "var(--chart-5)",
}

export function BookingStatusChart({ items = [], loading }) {
  if (loading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center pb-0">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto aspect-square max-h-[280px] w-full rounded-full" />
        </CardContent>
      </Card>
    )
  }

  const total = items.reduce((sum, row) => sum + row.count, 0)
  const completedCount = items.find((row) => row.key === "completed")?.count ?? 0

  const chartData = items
    .filter((item) => item.count > 0)
    .map((item) => ({
      status: item.key,
      count: item.count,
      fill: STATUS_COLORS[item.key] ?? "var(--chart-4)",
    }))
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle>Booking status</CardTitle>
        <CardDescription>Current order breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {total === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
            No bookings yet
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[280px]"
          >
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="min-w-40 gap-2.5"
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
                            style={{ "--color-bg": `var(--color-${name})` }}
                          />
                          <span className="text-muted-foreground">
                            {chartConfig[name]?.label || name}
                          </span>
                        </div>
                        <span className="text-foreground font-semibold tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend
                content={<ChartLegendContent nameKey="status" />}
                className="-translate-y-2"
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                cornerRadius={5}
                paddingAngle={3}
                stroke="var(--background)"
                strokeWidth={3}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold tabular-nums"
                          >
                            {completionRate}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 22}
                            className="fill-muted-foreground text-xs"
                          >
                            Completed
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
