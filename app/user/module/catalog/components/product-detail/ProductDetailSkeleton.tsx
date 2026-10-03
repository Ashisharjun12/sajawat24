import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProductDetailSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 56 }}>
      <View className="aspect-[4/3] w-full bg-muted" />
      <View className="gap-3 px-5 pt-5">
        <View className="h-4 w-24 rounded bg-muted" />
        <View className="h-7 w-full rounded bg-muted" />
        <View className="h-7 w-4/5 rounded bg-muted" />
        <View className="mt-2 h-10 w-40 rounded bg-muted" />
        <View className="h-24 w-full rounded-2xl bg-muted" />
        <View className="h-32 w-full rounded-2xl bg-muted" />
      </View>
    </View>
  );
}
