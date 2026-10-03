import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Check, ChevronRight, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type ProductLocationRowProps = {
  cityLabel: string;
  onChange: () => void;
};

export function ProductLocationRow({ cityLabel, onChange }: ProductLocationRowProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-600/20 bg-emerald-50 px-3 py-3">
      <View className="size-11 items-center justify-center rounded-xl border border-emerald-600/10 bg-background">
        <Icon as={MapPin} className="size-6 text-emerald-600" />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-foreground text-base font-bold" numberOfLines={1}>{cityLabel}</Text>
          <View className="flex-row items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5">
            <Icon as={Check} className="size-3 text-white" />
            <Text className="text-[10px] font-bold uppercase text-white">Available</Text>
          </View>
        </View>
        <Text className="text-xs font-medium text-emerald-700">We set up within 30 km across the city</Text>
      </View>
      <Pressable onPress={onChange} className="flex-row items-center shrink-0" accessibilityRole="button">
        <Text className="text-sm font-semibold text-emerald-700">Change</Text>
        <Icon as={ChevronRight} className="size-4 text-emerald-700" />
      </Pressable>
    </View>
  );
}
