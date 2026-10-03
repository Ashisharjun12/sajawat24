import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

function NotificationRowSkeleton() {
  return (
    <View className="flex-row items-start gap-3 pb-5 pt-2">
      <Skeleton className="mt-1 size-11 rounded-2xl" />
      <View className="min-w-0 flex-1 gap-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </View>
    </View>
  );
}

export function NotificationListSkeleton() {
  return (
    <View>
      <Skeleton className="mb-3 h-5 w-16" />
      <NotificationRowSkeleton />
      <View className="h-px bg-border/40" />
      <NotificationRowSkeleton />
      <View className="h-px bg-border/40" />
      <NotificationRowSkeleton />
      <Skeleton className="mb-3 mt-6 h-5 w-24" />
      <NotificationRowSkeleton />
      <View className="h-px bg-border/40" />
      <NotificationRowSkeleton />
    </View>
  );
}
