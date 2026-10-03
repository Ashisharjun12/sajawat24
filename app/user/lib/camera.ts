import * as ImagePicker from 'expo-image-picker';

export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status === ImagePicker.PermissionStatus.GRANTED) return 'granted';
    if (status === ImagePicker.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/** Request when user opens camera (profile/support) — not prompted on home. */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}
