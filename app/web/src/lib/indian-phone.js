/**
 * Clean what a user typed or pasted into a 10-digit Indian mobile field: digits only, a pasted
 * "+91 …" or leading "0" is dropped, and anything past 10 digits is ignored.
 */
export function sanitizeIndianPhoneInput(raw = "") {
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Indian mobile numbers are 10 digits and start with 6-9. */
export function isValidIndianMobileDigits(digits = "") {
  return /^[6-9]\d{9}$/.test(digits);
}

/** "+91 98765 43210" / "919876543210" / "9876543210" -> "9876543210". */
export function toLocalPhone(phone = "") {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}
