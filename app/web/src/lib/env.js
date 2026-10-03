export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

/** Public site origin for canonical URLs and Open Graph (no trailing slash). */
export const WEB_URL = (
  import.meta.env.VITE_WEB_URL || "https://www.deccorbuddys.com"
).replace(/\/$/, "");

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/** Vendor Android app — override with VITE_PLAY_STORE_URL when the listing is live */
export const PLAY_STORE_URL =
  import.meta.env.VITE_PLAY_STORE_URL ||
  "https://play.google.com/store/apps/details?id=com.deccoryy.partner";
