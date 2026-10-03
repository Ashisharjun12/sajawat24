import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

export function LocationAddressListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View className="gap-3">
      <Skeleton className="h-3 w-28 rounded-md" />
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        {Array.from({ length: rows }).map((_, index) => (
          <View
            key={index}
            className="flex-row gap-3 border-b border-border px-4 py-4 last:border-b-0">
            <Skeleton className="size-11 rounded-xl" />
            <View className="min-w-0 flex-1 gap-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-[85%] rounded-md" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
