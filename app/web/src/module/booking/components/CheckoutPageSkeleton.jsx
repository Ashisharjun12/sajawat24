import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutPageSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading checkout">
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-4 lg:px-10">
          <Link
            to="/decorations"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
            Continue shopping
          </Link>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1400px] lg:grid-cols-[minmax(0,1fr)_min(420px,38%)]">
        <div className="order-1 min-w-0 px-6 py-8 lg:px-10 lg:py-10">
          <div className="space-y-8">
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
              ))}
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-md" />
                <Skeleton className="h-4 w-full max-w-md rounded-md" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
        <aside
          className="order-2 border-t border-border/60 bg-muted/30 px-6 py-8 lg:min-h-[calc(100dvh-8rem)] lg:border-t-0 lg:border-l lg:px-8 lg:py-10"
        >
          <Skeleton className="h-6 w-32 rounded-md" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="mt-6 h-10 w-full rounded-lg" />
          <Skeleton className="mt-4 h-12 w-full rounded-lg" />
        </aside>
      </div>
    </div>
  );
}
