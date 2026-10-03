import { Surface } from '@/components/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

function StatSkeleton() {
  return (
    <View className="min-w-[45%] flex-1 gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-20" />
    </View>
  );
}

export function WalletSummarySkeleton() {
  return (
    <View className="gap-5">
      <Surface className="gap-4 border border-border/40 p-5 shadow-none">
        <View className="gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-3 w-48" />
        </View>

        <View className="border-border/60 flex-row flex-wrap gap-4 border-t pt-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </View>
      </Surface>

      <Skeleton className="h-12 w-full rounded-full" />
    </View>
  );
}
