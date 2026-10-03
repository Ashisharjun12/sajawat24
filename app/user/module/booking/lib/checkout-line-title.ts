/** Break long product/add-on names into short lines (~3 words per line). */
export function checkoutLineTitle(text: string | null | undefined, wordsPerLine = 3): string {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordsPerLine) return words.join(' ');
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '));
  }
  return lines.join('\n');
}
