import { cn } from '@/lib/utils';

/** Inset card (payment) vs full-bleed rows (confirm booking). */
export function checkoutSectionShell(inset = true) {
  return cn(
    'bg-card',
    inset ? 'rounded-2xl border border-border' : 'border-b border-border/80',
  );
}
