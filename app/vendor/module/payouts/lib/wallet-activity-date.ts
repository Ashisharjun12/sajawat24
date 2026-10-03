export type WalletActivityDatePreset = '30d' | '90d' | 'all' | 'custom';

export type WalletActivityDateRange = {
  from?: string;
  to?: string;
};

export function formatWalletActivityDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

export function resolveWalletActivityDateRange(
  preset: WalletActivityDatePreset,
  customFrom: Date | null,
  customTo: Date | null,
): WalletActivityDateRange {
  const today = startOfToday();

  if (preset === 'all') {
    return {};
  }

  if (preset === '30d') {
    return {
      from: formatWalletActivityDate(subtractDays(today, 29)),
      to: formatWalletActivityDate(today),
    };
  }

  if (preset === '90d') {
    return {
      from: formatWalletActivityDate(subtractDays(today, 89)),
      to: formatWalletActivityDate(today),
    };
  }

  if (!customFrom || !customTo) {
    return {};
  }

  const from = formatWalletActivityDate(customFrom);
  const to = formatWalletActivityDate(customTo);
  if (from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}

export function formatWalletActivityDateLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function walletActivityDatePresetLabel(
  preset: WalletActivityDatePreset,
  customFrom: Date | null,
  customTo: Date | null,
): string {
  if (preset === '30d') return 'Last 30 days';
  if (preset === '90d') return 'Last 90 days';
  if (preset === 'all') return 'All time';
  if (customFrom && customTo) {
    return `${formatWalletActivityDateLabel(customFrom)} – ${formatWalletActivityDateLabel(customTo)}`;
  }
  return 'Custom range';
}
