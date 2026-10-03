import { View } from 'react-native';

const SIZE = 44;

export function TripWorkerPinView() {
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#F5C518',
          borderWidth: 3,
          borderColor: '#ffffff',
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
            borderBottomColor: '#ffffff',
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
          backgroundColor: '#1A1A1A',
          borderWidth: 3,
          borderColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}>
        <View style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: '#ffffff' }} />
      </View>
    </View>
  );
}
