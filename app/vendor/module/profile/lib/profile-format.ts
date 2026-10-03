export function getProfileInitials(name?: string | null) {
  const parts = (name ?? 'Partner').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function formatProfilePhone(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
  return `+91 ${local}`;
}

export function formatProfileLocation(cityName?: string | null, state?: string | null) {
  const label = [cityName, state].filter(Boolean).join(', ');
  return label || null;
}
