/** Amount in paise (100 paise = ₹1). */
export function formatInr(amountPaise: number) {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function addonLineTotalPaise(pricePaise: number, quantity: number) {
  return pricePaise * quantity;
}

export function isFreeAddon(pricePaise: number, quantity: number) {
  return addonLineTotalPaise(pricePaise, quantity) === 0;
}

export function formatCollectionStatus(status: string) {
  if (status === 'not_required') return 'Not required';
  if (status === 'pending') return 'Pending';
  if (status === 'collected_cash') return 'Cash collected';
  if (status === 'collected_online') return 'Paid online';
  return status;
}

export function collectionStatusTone(status: string): 'amber' | 'emerald' | 'muted' {
  if (status === 'pending') return 'amber';
  if (status === 'collected_cash' || status === 'collected_online') return 'emerald';
  return 'muted';
}

export function formatCollectionSessionExpiry(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function isCollectionSessionExpired(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

type CollectionQrSession = {
  qrImageUrl?: string;
  qrBase64?: string;
};

/** Image `uri` for COD collect QR (handles URL, data-uri, or raw base64). */
export function collectionQrImageUri(session: CollectionQrSession): string | null {
  const imageUrl = session.qrImageUrl?.trim();
  if (imageUrl) return imageUrl;

  const raw = session.qrBase64?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('data:image/')) return raw;
  return `data:image/png;base64,${raw}`;
}

export function hasCollectionQrDisplay(session: CollectionQrSession): boolean {
  return collectionQrImageUri(session) != null;
}
