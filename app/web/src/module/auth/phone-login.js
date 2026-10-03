const RESEND_SECONDS = 30;

export function phoneDigits(value = "") {
  return value.replace(/\D/g, "");
}

export function isValidIndianMobile(value = "") {
  const digits = phoneDigits(value);
  if (digits.length === 10) {
    return /^[6-9]/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^91[6-9]/.test(digits);
  }
  return false;
}

export function formatPhonePreview(value = "") {
  const digits = phoneDigits(value);
  const local =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (local.length !== 10) {
    return value.trim() || "your phone";
  }
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

export { RESEND_SECONDS };
