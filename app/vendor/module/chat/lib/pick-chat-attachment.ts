import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export type ChatAttachmentSource = 'camera' | 'image' | 'file';

export type PickedChatAttachment = {
  uri: string;
  fileName: string;
  mimeType: string;
  kind: 'image' | 'file';
};

async function ensurePermission(
  request: () => Promise<ImagePicker.PermissionResponse>,
  label: string,
): Promise<boolean> {
  const result = await request();
  if (result.granted) return true;

  if (!result.canAskAgain) {
    Alert.alert(
      'Permission needed',
      `Allow ${label} access in settings to send attachments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  }

  Alert.alert('Permission needed', `Allow ${label} access to send attachments.`);
  return false;
}

function guessImageMime(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function pickChatAttachment(
  source: ChatAttachmentSource,
): Promise<PickedChatAttachment | null> {
  if (source === 'camera') {
    const allowed = await ensurePermission(
      ImagePicker.requestCameraPermissionsAsync,
      'camera',
    );
    if (!allowed) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? `photo-${Date.now()}.jpg`;
    return {
      uri: asset.uri,
      fileName,
      mimeType: asset.mimeType ?? guessImageMime(fileName),
      kind: 'image',
    };
  }

  if (source === 'image') {
    const allowed = await ensurePermission(
      ImagePicker.requestMediaLibraryPermissionsAsync,
      'photos',
    );
    if (!allowed) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? `image-${Date.now()}.jpg`;
    return {
      uri: asset.uri,
      fileName,
      mimeType: asset.mimeType ?? guessImageMime(fileName),
      kind: 'image',
    };
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'application/pdf';
  const kind = mimeType.startsWith('image/') ? 'image' : 'file';
  return {
    uri: asset.uri,
    fileName: asset.name ?? `file-${Date.now()}`,
    mimeType,
    kind,
  };
}
