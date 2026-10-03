import type { MapsSdkConfig } from '@/api/maps.api';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
};

type Props = {
  sdkConfig: MapsSdkConfig;
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: MapMarker[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  onCenterChange?: (center: { latitude: number; longitude: number }) => void;
  className?: string;
  variant?: 'static' | 'trip';
  followCenter?: { latitude: number; longitude: number } | null;
  fitCoordinates?: Array<{ latitude: number; longitude: number }>;
};

export function OlaMapView({ className }: Props) {
  return (
    <View className={className ?? 'flex-1 items-center justify-center bg-muted px-4'}>
      <Text className="text-center text-sm text-muted-foreground">
        Map is available in the Android app only.
      </Text>
    </View>
  );
}
