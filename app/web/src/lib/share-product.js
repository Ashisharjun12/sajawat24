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

function openShareWindow(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareViaTelegram(title, url) {
  const text = encodeURIComponent((title ?? "").trim() || "Decoration setup");
  openShareWindow(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`);
}

export function shareViaFacebook(url) {
  openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
}

/** SMS composer (phones only). iOS uses "&body=", Android "?body=". */
export function shareViaSms(message) {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const body = encodeURIComponent(message ?? "");
  window.location.href = isIos ? `sms:&body=${body}` : `sms:?body=${body}`;
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
