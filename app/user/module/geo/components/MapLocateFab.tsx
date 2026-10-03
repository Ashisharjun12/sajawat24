import { Icon } from '@/components/ui/icon';
import { Crosshair } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

type MapLocateFabProps = {
  onPress: () => void;
  bottom: number;
  loading?: boolean;
  disabled?: boolean;
};

/** Floating “my location” control (maps-style, bottom-left). */
export function MapLocateFab({ onPress, bottom, loading, disabled }: MapLocateFabProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel="Go to current location"
      className="absolute left-4 z-30 size-11 items-center justify-center rounded-full bg-background shadow-md active:opacity-90"
      style={{ bottom, elevation: 8 }}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View className="size-8 items-center justify-center rounded-full">
          <Icon as={Crosshair} className="text-foreground size-5" />
        </View>
      )}
    </Pressable>
  );
}
