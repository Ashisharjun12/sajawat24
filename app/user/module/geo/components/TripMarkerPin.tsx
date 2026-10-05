import { colors } from '@/lib/design-tokens';
import { View } from 'react-native';

const SIZE = 44;
const brand = colors.light;

export function TripWorkerPinView() {
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: brand.primary,
          borderWidth: 3,
          borderColor: brand.surface,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}>
        <View
          style={{
            width: 0,
            height: 0,
            marginTop: -2,
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderBottomWidth: 10,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: brand.onPrimary,
          }}
        />
      </View>
    </View>
  );
}

export function TripCustomerPinView() {
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 34,
          backgroundColor: brand.text,
          borderWidth: 3,
          borderColor: brand.surface,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}>
        <View style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: brand.surface }} />
      </View>
    </View>
  );
}
