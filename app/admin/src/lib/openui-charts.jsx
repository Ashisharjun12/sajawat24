import { defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const CHART_COLORS = [
  "#2563eb",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#eab308",
]

function seriesKey(index) {
  return `s${index}`
}

function toNumbers(values) {
  if (!Array.isArray(values)) return []
  return values.map((value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  })
}

function chartConfig(names) {
  const config = {}
  names.forEach((name, index) => {
    config[seriesKey(index)] = {
      label: name || `Series ${index + 1}`,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
  })
  return config
}

function cartesianRows(labels, names, seriesValues) {
  return labels.map((label, index) => {
    const row = { label: String(label) }
    names.forEach((_, seriesIndex) => {
      row[seriesKey(seriesIndex)] = toNumbers(seriesValues[seriesIndex])[index] ?? 0
    })
    return row
  })
}

function ChartShell({ title, config, className = "h-[260px] w-full", children }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className={className}>
          {children}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export const BarChart = defineComponent({
  name: "BarChart",
  description:
    "Colored vertical bars. Single series: labels + values, each bar a chart color. Compare groups: also pass seriesNames and seriesValues (number[][] aligned to seriesNames, each inner array aligned to labels).",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
    seriesNames: z.array(z.string()).optional(),
    seriesValues: z.array(z.array(z.number())).optional(),
  }),
  component: ({ props }) => {
    const grouped = Array.isArray(props.seriesNames) && props.seriesNames.length > 0 && Array.isArray(props.seriesValues)
    const names = grouped ? props.seriesNames : ["Value"]
    const seriesValues = grouped ? props.seriesValues : [toNumbers(props.values)]
    const data = cartesianRows(props.labels, names, seriesValues)
    const config = chartConfig(names)
    return (
      <ChartShell title={props.title} config={config}>
        <RechartsBarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {grouped ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {names.map((name, index) => (
            <Bar
              key={name}
              dataKey={seriesKey(index)}
              fill={`var(--color-${seriesKey(index)})`}
              radius={4}
            >
              {grouped
                ? null
                : data.map((row, barIndex) => (
                    <Cell key={row.label} fill={CHART_COLORS[barIndex % CHART_COLORS.length]} />
                  ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ChartShell>
    )
  },
})

export const LineChart = defineComponent({
  name: "LineChart",
  description:
    "Colored line chart for trends and compares over dates. seriesNames like [\"Users\",\"Products\"]. seriesValues is number[][] — one array per series, same length as labels.",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    seriesNames: z.array(z.string()),
    seriesValues: z.array(z.array(z.number())),
  }),
  component: ({ props }) => {
    const names = props.seriesNames.length ? props.seriesNames : ["Value"]
    const data = cartesianRows(props.labels, names, props.seriesValues)
    const config = chartConfig(names)
    return (
      <ChartShell title={props.title} config={config}>
        <RechartsLineChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {names.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={seriesKey(index)}
              stroke={`var(--color-${seriesKey(index)})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ChartShell>
    )
  },
})

export const AreaChart = defineComponent({
  name: "AreaChart",
  description:
    "Colored filled area chart for volume over time. Same seriesNames + seriesValues shape as LineChart.",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    seriesNames: z.array(z.string()),
    seriesValues: z.array(z.array(z.number())),
  }),
  component: ({ props }) => {
    const names = props.seriesNames.length ? props.seriesNames : ["Value"]
    const data = cartesianRows(props.labels, names, props.seriesValues)
    const config = chartConfig(names)
    return (
      <ChartShell title={props.title} config={config}>
        <RechartsAreaChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {names.map((name, index) => (
            <Area
              key={name}
              type="monotone"
              dataKey={seriesKey(index)}
              stroke={`var(--color-${seriesKey(index)})`}
              fill={`var(--color-${seriesKey(index)})`}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
        </RechartsAreaChart>
      </ChartShell>
    )
  },
})

export const PieChart = defineComponent({
  name: "PieChart",
  description:
    "Colored pie / donut for mix and share (status mix, city share). labels and values are parallel arrays.",
  props: z.object({
    title: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
  }),
  component: ({ props }) => {
    const values = toNumbers(props.values)
    const data = props.labels.map((label, index) => ({
      label: String(label),
      value: values[index] ?? 0,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      key: seriesKey(index),
    }))
    const config = {}
    props.labels.forEach((label, index) => {
      config[String(label)] = {
        label: String(label),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    return (
      <ChartShell title={props.title} config={config} className="mx-auto aspect-square max-h-[280px]">
        <RechartsPieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} strokeWidth={2}>
            {data.map((slice) => (
              <Cell key={slice.label} fill={slice.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="label" />} />
        </RechartsPieChart>
      </ChartShell>
    )
  },
})
