export function formatIndiaPhoneDisplay(phone: string): string {
  const local = toLocalPhone(phone);
  if (!local) return '';
  return `🇮🇳 +91 ${local}`;
}

export function toLocalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}
