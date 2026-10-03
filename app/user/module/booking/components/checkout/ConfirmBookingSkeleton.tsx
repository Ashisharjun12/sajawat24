import { Screen, SmoothScrollView, TabScreenTitle } from '@/components/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ConfirmBookingSkeletonProps = {
  onBack: () => void;
};

export function ConfirmBookingSkeleton({ onBack }: ConfirmBookingSkeletonProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName="flex-1">
      <TabScreenTitle title="Confirm booking" showBack onBack={onBack} insetFromParentGutter />
      <SmoothScrollView
        className="flex-1"
        contentContainerClassName="gap-4 pb-4 pt-2"
        contentContainerStyle={{ paddingBottom: 132 + insets.bottom }}
        showsVerticalScrollIndicator={false}>
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Skeleton className="w-full rounded-none" style={{ height: 164 }} />
          <View className="gap-3 p-4">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-2/5 rounded-md" />
          </View>
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="size-10 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </View>
        </View>

        <View className="rounded-2xl border border-border bg-card p-4">
          <Skeleton className="mb-3 h-5 w-28 rounded-md" />
          <View className="gap-2.5">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="mt-2 h-6 w-full rounded-md" />
          </View>
        </View>

        <View className="rounded-2xl border border-border bg-card p-4">
          <Skeleton className="mb-2 h-4 w-36 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
        </View>
      </SmoothScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-background px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Skeleton className="h-12 w-full rounded-full" />
      </View>
    </Screen>
  );
}
