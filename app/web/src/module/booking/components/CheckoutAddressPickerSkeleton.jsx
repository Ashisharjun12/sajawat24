import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutAddressPickerSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading saved addresses">
      <Skeleton className="h-4 w-32 rounded-md" />
      <Skeleton className="h-3 w-full max-w-sm rounded-md" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-[5.5rem] w-full rounded-lg" />
        <Skeleton className="h-[5.5rem] w-full rounded-lg" />
      </div>
      <Skeleton className="h-9 w-44 rounded-full" />
      <Skeleton className="h-4 w-52 rounded-md" />
    </div>
  );
}
