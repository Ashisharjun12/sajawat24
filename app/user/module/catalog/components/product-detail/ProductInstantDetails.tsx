import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Clock, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

const ETA_FALLBACK = 15;

type ProductInstantDetailsProps = {
  note?: string | null;
  etaMinutes?: number | null;
};

export function ProductInstantDetails({ note, etaMinutes }: ProductInstantDetailsProps) {
  const description = (note ?? '').trim();
  const eta = etaMinutes ?? ETA_FALLBACK;

  return (
    <View className="gap-3">
      {description ? (
        <View className="flex-row gap-3">
          <View className="size-10 items-center justify-center rounded-full bg-emerald-600/15">
            <Icon as={Sparkles} className="size-4 text-emerald-600" />
          </View>
          <Text className="text-foreground min-w-0 flex-1 pt-2 text-sm leading-relaxed">
            {description}
          </Text>
        </View>
      ) : null}
      <View className="flex-row gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-blue-600/15">
          <Icon as={Clock} className="size-4 text-blue-600" />
        </View>
        <Text className="text-muted-foreground min-w-0 flex-1 pt-2 text-sm leading-relaxed">
          Typical arrival window: about {eta} minutes after confirmation.
        </Text>
      </View>
    </View>
  );
}
