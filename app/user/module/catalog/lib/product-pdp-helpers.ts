export function filledPoints(items: unknown[] | null | undefined): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => String(item).trim()).filter(Boolean);
}

export type ProductFaq = { question?: string; answer?: string; key?: string };

export function filledFaqs(items: ProductFaq[] | null | undefined): ProductFaq[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => (item.question ?? '').trim() && (item.answer ?? '').trim());
}

export function formatPdpRating(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}
