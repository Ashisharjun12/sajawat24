export const TIME_SLOTS = [
  { id: '9-12', label: '9 AM – 12 PM' },
  { id: '12-3', label: '12 PM – 3 PM' },
  { id: '3-6', label: '3 PM – 6 PM', fillingFast: true },
  { id: '6-9', label: '6 PM – 9 PM' },
  { id: '9-11', label: '9 PM – 11 PM' },
] as const;

export type TimeSlotId = (typeof TIME_SLOTS)[number]['id'];

export function slotLabelFor(slotId: string): string {
  return TIME_SLOTS.find((item) => item.id === slotId)?.label ?? '';
}

export function slotHour(slotId: string): number {
  if (slotId === '9-12') return 9;
  if (slotId === '12-3') return 12;
  if (slotId === '3-6') return 15;
  if (slotId === '6-9') return 18;
  return 21;
}

export function buildScheduledIso(date: Date, slotId: string): string {
  const scheduled = new Date(date);
  scheduled.setHours(slotHour(slotId), 0, 0, 0);
  return scheduled.toISOString();
}
