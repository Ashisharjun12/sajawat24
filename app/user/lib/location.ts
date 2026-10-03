export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) return 'granted';
    if (status === Location.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function requestForegroundLocationPermission(): Promise<boolean> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}
