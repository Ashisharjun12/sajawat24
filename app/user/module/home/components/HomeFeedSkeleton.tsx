import { Skeleton } from '@/components/ui/skeleton';
import { Dimensions, ScrollView, View } from 'react-native';

const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = Dimensions.get('window').width - HORIZONTAL_PADDING * 2;
const BANNER_HEIGHT = Math.round((CARD_WIDTH * 9) / 16);
const COLS = 4;

export function HomeFeedSkeleton() {
  return (
    <View className="gap-10 pt-2">
      <View className="px-4">
        <Skeleton className="rounded-2xl" style={{ width: CARD_WIDTH, height: BANNER_HEIGHT }} />
      </View>

      <View className="gap-4 px-4">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-4 w-56 rounded-md" />
        <View className="gap-3">
          {Array.from({ length: 2 }).map((_, row) => (
            <View key={row} className="flex-row gap-2">
              {Array.from({ length: COLS }).map((__, col) => (
                <View key={col} className="min-w-0 flex-1 items-center gap-2">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-3 w-full rounded-md" />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <HomeRailSkeleton />
      <HomeRailSkeleton />
    </View>
  );
}

function HomeRailSkeleton() {
  return (
    <View className="gap-3">
      <View className="gap-2 px-4">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="w-[168px] overflow-hidden rounded-2xl border border-border">
            <Skeleton className="h-[112px] w-full rounded-none" />
            <View className="gap-2 p-3">
              <Skeleton className="h-3.5 w-[90%] rounded-md" />
              <Skeleton className="h-3.5 w-[65%] rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
