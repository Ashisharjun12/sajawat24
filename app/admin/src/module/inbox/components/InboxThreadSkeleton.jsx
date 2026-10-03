import { Skeleton } from "@/components/ui/skeleton"

export function InboxThreadSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="flex justify-start">
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-56 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-16 w-64 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-2xl" />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </div>
  )
}
