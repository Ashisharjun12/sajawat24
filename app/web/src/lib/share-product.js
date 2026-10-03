export function buildProductShareMessage(title, url) {
  const name = (title ?? "").trim() || "Decoration setup";
  return `${name}\n${url}`;
}

export function shareViaWhatsApp(message) {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function shareViaEmail(subject, body) {
  const params = new URLSearchParams({
    subject: subject ?? "",
    body: body ?? "",
  });
  window.location.href = `mailto:?${params.toString()}`;
}

export async function copyProductLink(url) {
  await navigator.clipboard.writeText(url);
}

export async function shareNative({ title, url }) {
  if (!navigator.share) return false;
  await navigator.share({
    title: (title ?? "").trim() || "Decoration setup",
    text: (title ?? "").trim() || undefined,
    url,
  });
  return true;
}

export function canUseNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
