import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

function HomeBookingPreviewCardSkeleton() {
  return (
    <View className="flex-row items-start gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
      <Skeleton className="size-9 rounded-full" />
      <View className="min-w-0 flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </View>
      <Skeleton className="h-4 w-12" />
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View className="gap-5">
      <View className="gap-2 rounded-3xl bg-muted/50 px-5 py-8">
        <Skeleton className="mx-auto h-5 w-40" />
        <Skeleton className="mx-auto h-3 w-full max-w-xs" />
        <Skeleton className="mx-auto h-3 w-4/5 max-w-xs" />
      </View>

      <View className="flex-row gap-3">
        <Skeleton className="h-[108px] flex-1 rounded-3xl" />
        <Skeleton className="h-[108px] flex-1 rounded-3xl" />
      </View>

      <View className="gap-3">
        <Skeleton className="h-5 w-36" />
        <View className="gap-2">
          <HomeBookingPreviewCardSkeleton />
          <HomeBookingPreviewCardSkeleton />
          <HomeBookingPreviewCardSkeleton />
        </View>
        <Skeleton className="h-11 w-full rounded-full" />
      </View>
    </View>
  );
}
