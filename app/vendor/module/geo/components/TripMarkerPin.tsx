import { View } from 'react-native';

const SIZE = 44;

/** Partner / worker live GPS — amber, navigation cue. */
export function TripWorkerPinView() {
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
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#F5C518',
          borderWidth: 3,
          borderColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
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

/** Customer venue — fixed delivery pin from booking. */
export function TripCustomerPinView() {
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
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#1A1A1A',
          borderWidth: 3,
          borderColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 5,
        }}>
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 2,
            backgroundColor: '#ffffff',
          }}
        />
      </View>
    </View>
  );
}
