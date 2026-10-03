import { WEB_URL } from '@/lib/env';
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Platform, Share } from 'react-native';

export function productPath(productId: string) {
  return `/p/${productId.trim()}`;
}

export function productShareUrl(productId: string) {
  return `${WEB_URL}${productPath(productId)}`;
}

export function productShareMessage(title: string, url: string) {
  const name = (title ?? '').trim() || 'Decoration setup';
  return `${name}\n${url}`;
}

/** Run after closing a Modal so Alert / Share / Linking work on Android. */
export function afterModalDismiss(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Platform.OS === 'android' ? 280 : 80);
  });
}

export async function shareViaWhatsApp(message: string): Promise<boolean> {
  const encoded = encodeURIComponent(message);
  const candidates = [
    `whatsapp://send?text=${encoded}`,
    `https://wa.me/?text=${encoded}`,
  ];

  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // try next scheme
    }
  }

  Alert.alert('Could not open WhatsApp', 'Try Copy link instead.');
  return false;
}

export async function copyProductLink(url: string) {
  await Clipboard.setStringAsync(url);
}

export async function shareNative(title: string, url: string) {
  const displayTitle = (title ?? '').trim() || 'Decoration setup';
  const message = productShareMessage(displayTitle, url);
  const result = await Share.share(
    Platform.OS === 'android'
      ? { message, title: displayTitle }
      : { message, url, title: displayTitle },
  );
  if (result.action === Share.dismissedAction) {
    return;
  }
}
