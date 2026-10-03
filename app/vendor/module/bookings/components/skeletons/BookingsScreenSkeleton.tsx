import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

function JobCardSkeleton() {
  return (
    <View className="gap-3 rounded-3xl bg-card p-4 shadow-soft">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </View>
        <Skeleton className="h-6 w-20 rounded-full" />
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </View>
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </View>
      </View>

      <Skeleton className="h-4 w-20" />
    </View>
  );
}

const FILTER_PLACEHOLDERS = [72, 88, 96, 84];

export function BookingsScreenSkeleton() {
  return (
    <View className="gap-5">
      <View className="flex-row gap-2">
        {FILTER_PLACEHOLDERS.map((width) => (
          <Skeleton key={width} className="h-9 rounded-full" style={{ width }} />
        ))}
      </View>

      <View className="gap-3">
        <JobCardSkeleton />
        <JobCardSkeleton />
        <JobCardSkeleton />
      </View>
    </View>
  );
}
