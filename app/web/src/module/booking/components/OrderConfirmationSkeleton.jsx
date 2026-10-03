import { Skeleton } from "@/components/ui/skeleton";

export function OrderConfirmationSkeleton() {
  return (
    <div className="grid w-full lg:grid-cols-2">
      <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-14">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="border-t border-border/60 bg-primary/10 px-6 py-8 lg:border-t-0 lg:border-l lg:px-8 lg:py-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-6 h-16 w-full" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
