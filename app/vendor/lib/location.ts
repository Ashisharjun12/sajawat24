export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

let locationModuleAvailable: boolean | null = null;

async function getLocationModule() {
  if (locationModuleAvailable === false) {
    return null;
  }

  try {
    const Location = await import('expo-location');
    locationModuleAvailable = true;
    return Location;
  } catch {
    locationModuleAvailable = false;
    return null;
  }
}

export async function isLocationModuleAvailable() {
  const module = await getLocationModule();
  return module !== null;
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  const Location = await getLocationModule();
  if (!Location) return 'undetermined';

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) return 'granted';
    if (status === Location.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const Location = await getLocationModule();
  if (!Location) return false;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}
