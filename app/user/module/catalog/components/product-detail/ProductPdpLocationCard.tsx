import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { type Href, router } from 'expo-router';
import { Check, ChevronRight, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type ProductPdpLocationCardProps = {
  cityLabel: string;
};

export function ProductPdpLocationCard({ cityLabel }: ProductPdpLocationCardProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-600/20 bg-emerald-50/90 px-3 py-3">
      <View className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-600/10 bg-background shadow-sm">
        <Icon as={MapPin} className="text-emerald-700 size-6" />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="text-foreground text-base font-bold" numberOfLines={1}>
            {cityLabel}
          </Text>
          <View className="flex-row items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5">
            <Icon as={Check} className="size-3 text-white" strokeWidth={3} />
            <Text className="text-[10px] font-bold uppercase tracking-wide text-white">
              Available
            </Text>
          </View>
        </View>
        <Text className="text-emerald-700 text-xs font-medium sm:text-sm">
          We set up within 30 km across the city
        </Text>
      </View>
      <Pressable
        onPress={() => router.push(SELECT_LOCATION_HREF as Href)}
        className="shrink-0 flex-row items-center gap-0.5"
        hitSlop={8}>
        <Text className="text-emerald-700 text-sm font-semibold">Change</Text>
        <Icon as={ChevronRight} className="text-emerald-700 size-4" />
      </Pressable>
    </View>
  );
}
