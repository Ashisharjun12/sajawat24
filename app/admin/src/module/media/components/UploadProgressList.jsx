import { Progress, ProgressValue } from "@/components/ui/progress"

export function UploadProgressList({ items }) {
  if (!items?.length) return null

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1.5 rounded-2xl border bg-card p-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{item.name}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {item.status === "error" ? "Failed" : `${item.percent}%`}
            </span>
          </div>
          <Progress value={item.percent}>
            <ProgressValue />
          </Progress>
        </div>
      ))}
    </div>
  )
}
