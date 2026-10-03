import { format } from 'date-fns';

export function formatCartSlotLabel(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return format(new Date(iso), 'EEE d MMM, h a');
  } catch {
    return null;
  }
}
