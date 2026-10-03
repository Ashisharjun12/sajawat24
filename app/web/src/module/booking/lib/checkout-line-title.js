/** Break long product/add-on names into short lines (~3 words per line). */
export function checkoutLineTitle(text, wordsPerLine = 3) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordsPerLine) return words.join(" ");
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines.join("\n");
}
