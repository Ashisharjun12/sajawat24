import { Skeleton } from "@/components/ui/skeleton";

export function SearchProductRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <Skeleton className="size-14 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-[90%] rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
      <Skeleton className="size-4 shrink-0 rounded-sm" />
    </div>
  );
}
