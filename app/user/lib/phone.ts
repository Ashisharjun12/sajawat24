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

/**
 * Clean what a user typed or pasted into a 10-digit Indian mobile field: digits only, a pasted
 * "+91 …" or leading "0" is dropped, and anything past 10 digits is ignored.
 */
export function sanitizeIndianPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Indian mobile numbers are 10 digits and start with 6-9. */
export function isValidIndianMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}
