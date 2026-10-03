import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 6

export function InboxConversationSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <div key={index} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-full max-w-48" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
