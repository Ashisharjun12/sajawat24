import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

function WalletActivityRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <Skeleton className="size-10 rounded-full" />
      <View className="min-w-0 flex-1 gap-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
      </View>
      <Skeleton className="h-5 w-16" />
    </View>
  );
}

export function WalletActivitySkeleton() {
  return (
    <View>
      <WalletActivityRowSkeleton />
      <View className="h-px bg-border/40" />
      <WalletActivityRowSkeleton />
      <View className="h-px bg-border/40" />
      <WalletActivityRowSkeleton />
      <View className="h-px bg-border/40" />
      <WalletActivityRowSkeleton />
    </View>
  );
}
