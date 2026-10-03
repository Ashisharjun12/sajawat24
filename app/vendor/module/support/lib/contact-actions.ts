import { Alert, Linking } from 'react-native';

export function normalizeTel(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function openPhoneCall(phone: string): Promise<void> {
  const tel = normalizeTel(phone);
  if (!tel) return;
  const url = `tel:${tel}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert('Cannot call', phone);
    return;
  }
  await Linking.openURL(url);
}

export async function openEmailCompose(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) return;
  const url = `mailto:${trimmed}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert('Cannot open email', trimmed);
    return;
  }
  await Linking.openURL(url);
}

export async function openExternalUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) return;
  const can = await Linking.canOpenURL(trimmed);
  if (!can) {
    Alert.alert('Cannot open link', trimmed);
    return;
  }
  await Linking.openURL(trimmed);
}

export function showCopiedAlert(label: string, value: string) {
  Alert.alert('Copied', `${label} copied to clipboard.`);
}
