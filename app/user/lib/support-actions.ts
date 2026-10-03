import { loadSiteBrandContact } from '@/lib/site-brand-contact';
import { Alert, Linking } from 'react-native';

export async function openWhatsAppSupport() {
  const { whatsappUrl, contactPhone } = await loadSiteBrandContact();

  if (whatsappUrl) {
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch {
      // fall through to phone
    }
  }

  if (contactPhone) {
    const tel = contactPhone.startsWith('tel:') ? contactPhone : `tel:${contactPhone}`;
    try {
      await Linking.openURL(tel);
      return;
    } catch {
      // show alert below
    }
  }

  Alert.alert(
    'Support unavailable',
    'Support contact is not available right now. Try again later or use Help in your profile.',
  );
}
