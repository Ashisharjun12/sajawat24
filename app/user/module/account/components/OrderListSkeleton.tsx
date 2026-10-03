import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

export function OrderListSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((key) => (
        <View key={key} className="flex-row gap-3 rounded-2xl border border-border bg-card p-3">
          <Skeleton className="size-24 rounded-xl" />
          <View className="min-w-0 flex-1 gap-2">
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="mt-1 h-11 w-full rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
}
