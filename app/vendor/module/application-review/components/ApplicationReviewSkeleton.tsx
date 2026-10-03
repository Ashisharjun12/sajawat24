import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

function ReviewStepRowSkeleton({ isLast = false }: { isLast?: boolean }) {
  return (
    <View className="flex-row gap-4">
      <View className="items-center">
        <Skeleton className="size-8 rounded-full" />
        {!isLast ? <Skeleton className="my-1 w-0.5 flex-1 min-h-[36px] rounded-full" /> : null}
      </View>
      <View className={isLast ? 'flex-1' : 'flex-1 pb-6'}>
        <Skeleton className="mb-2 h-4 w-40" />
        <Skeleton className="h-3 w-full max-w-xs" />
        <Skeleton className="mt-1 h-3 w-4/5" />
      </View>
    </View>
  );
}

export function ApplicationReviewSkeleton() {
  return (
    <View className="flex-1">
      <View className="flex-1 px-8 pb-6 pt-4">
        <View className="mb-6 items-center">
          <Skeleton className="h-3 w-28" />
        </View>

        <Skeleton className="mb-6 h-[180px] w-full max-w-[260px] self-center" />

        <View className="mb-8 gap-3">
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </View>

        <View className="mb-8">
          <Skeleton className="mb-4 h-4 w-40" />
          <ReviewStepRowSkeleton />
          <ReviewStepRowSkeleton />
          <ReviewStepRowSkeleton isLast />
        </View>

        <Skeleton className="h-16 w-full rounded-2xl" />
      </View>

      <View className="border-border border-t px-8 pb-10 pt-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </View>
    </View>
  );
}
