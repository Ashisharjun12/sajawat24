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

/** Open the first URL that works; returns false (with an alert) if none can be opened. */
async function openFirst(urls: string[], failTitle: string): Promise<boolean> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // try next
    }
  }
  Alert.alert(failTitle, 'Try Copy link instead.');
  return false;
}

export function shareViaTelegram(title: string, url: string) {
  const text = encodeURIComponent((title ?? '').trim() || 'Decoration setup');
  const link = encodeURIComponent(url);
  return openFirst(
    [`tg://msg_url?url=${link}&text=${text}`, `https://t.me/share/url?url=${link}&text=${text}`],
    'Could not open Telegram',
  );
}

export function shareViaFacebook(url: string) {
  const link = encodeURIComponent(url);
  return openFirst(
    [`https://www.facebook.com/sharer/sharer.php?u=${link}`],
    'Could not open Facebook',
  );
}

export function shareViaSms(message: string) {
  const body = encodeURIComponent(message);
  // iOS uses "&body=", Android "?body=".
  return openFirst(
    [Platform.OS === 'ios' ? `sms:&body=${body}` : `sms:?body=${body}`],
    'Could not open Messages',
  );
}

export function shareViaEmail(title: string, message: string) {
  const subject = encodeURIComponent((title ?? '').trim() || 'Decoration setup');
  const body = encodeURIComponent(message);
  return openFirst([`mailto:?subject=${subject}&body=${body}`], 'Could not open email');
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
