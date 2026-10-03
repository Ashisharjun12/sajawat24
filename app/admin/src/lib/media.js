import { mediaDisplayUrl } from "@/api/uploads.api";

export const OPEN_FOLDER_IMAGE_URL = "https://ik.imagekit.io/aevhlnk0h/open-folder.png";

export function viewMediaInNewTab(item) {
  const url = mediaDisplayUrl(item);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadMedia(item) {
  const url = mediaDisplayUrl(item);
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.download = item.filename || "download";
  link.rel = "noopener";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
