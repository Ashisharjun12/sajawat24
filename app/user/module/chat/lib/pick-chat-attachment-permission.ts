import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

type PermissionKind = 'camera' | 'photos';

const COPY: Record<PermissionKind, { title: string; why: string; settings: string }> = {
  camera: {
    title: 'Allow camera access',
    why: 'Sajawat24 needs the camera to take a photo and send it in this chat.',
    settings:
      'Camera access is turned off for Sajawat24. Turn it on in Settings to take and send photos.',
  },
  photos: {
    title: 'Allow photo access',
    why: 'Sajawat24 needs access to your photos to send a picture in this chat.',
    settings:
      'Photo access is turned off for Sajawat24. Turn it on in Settings to send pictures.',
  },
};

function check(kind: PermissionKind) {
  return kind === 'camera'
    ? ImagePicker.getCameraPermissionsAsync()
    : ImagePicker.getMediaLibraryPermissionsAsync();
}

function request(kind: PermissionKind) {
  return kind === 'camera'
    ? ImagePicker.requestCameraPermissionsAsync()
    : ImagePicker.requestMediaLibraryPermissionsAsync();
}

/** iOS "Selected photos" (limited) still lets the picker open with what the user chose. */
function isUsable(result: ImagePicker.PermissionResponse | ImagePicker.MediaLibraryPermissionResponse) {
  if (result.granted) return true;
  return 'accessPrivileges' in result && result.accessPrivileges === 'limited';
}

function confirm(title: string, message: string, actionLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: actionLabel, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/**
 * Ask for camera / photo access only when the user picks that option in the chat:
 * 1. Already allowed → go.
 * 2. Never asked (or can ask again) → short explanation, then the system prompt.
 * 3. Blocked ("Don't allow" / "Don't ask again") → explain and offer "Open Settings".
 */
export async function ensureChatMediaPermission(kind: PermissionKind): Promise<boolean> {
  const copy = COPY[kind];
  const current = await check(kind);
  if (isUsable(current)) return true;

  if (current.canAskAgain) {
    // First time: the OS shows its own prompt right away. After a "Don't allow", explain first.
    if (current.status === ImagePicker.PermissionStatus.DENIED) {
      const go = await confirm(copy.title, copy.why, 'Allow');
      if (!go) return false;
    }
    const asked = await request(kind);
    if (isUsable(asked)) return true;
    if (asked.canAskAgain) return false;
  }

  const openSettings = await confirm(copy.title, copy.settings, 'Open Settings');
  if (openSettings) void Linking.openSettings();
  return false;
}
