import { View } from 'react-native';

const SIZE = 44;
const HALO = '#4285F433';
const BLUE = '#4285F4';

/** Google Maps–style live GPS dot (moving decorator). */
export function LiveLocationDotView() {
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: HALO,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: BLUE,
            borderWidth: 3,
            borderColor: '#ffffff',
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
          }}
        />
      </View>
    </View>
  );
}
