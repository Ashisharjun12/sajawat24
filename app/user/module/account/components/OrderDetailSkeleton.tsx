import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

export function OrderDetailSkeleton() {
  return (
    <View className="mt-4 gap-5">
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        <Skeleton className="h-40 w-full rounded-none" />
        <View className="gap-3 p-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
          <Skeleton className="mt-2 h-8 w-28 rounded-md" />
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 gap-3">
        <Skeleton className="h-5 w-24 rounded-md" />
        <View className="flex-row gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-4 flex-1 rounded-md" />
        </View>
        <View className="flex-row gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-md" />
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 gap-3">
        <Skeleton className="h-5 w-20 rounded-md" />
        <View className="flex-row gap-3">
          <Skeleton className="size-14 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </View>
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 gap-4">
        <Skeleton className="h-5 w-32 rounded-md" />
        {[0, 1, 2, 3].map((key) => (
          <View key={key} className="flex-row items-center gap-3">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded-md" />
          </View>
        ))}
      </View>

      <Skeleton className="h-12 w-full rounded-full" />
    </View>
  );
}
