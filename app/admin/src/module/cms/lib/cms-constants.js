export const CMS_PLACEMENTS = [
  "announcement_bar",
  "home_hero",
  "home_mid",
  "home_end",
];

export const CMS_STATUSES = ["draft", "published", "hidden"];

/** Website / mweb editors (Content → Web | Mobile). */
export const CMS_WEBSITE_PLATFORMS = ["web", "mobile"];

/** Full API platform list (app channel uses android in dedicated forms). */
export const CMS_PLATFORMS = ["web", "mobile", "android", "ios"];

export function websitePlatformsOnly(platforms) {
  const list = Array.isArray(platforms) ? platforms : []
  const filtered = list.filter((p) => CMS_WEBSITE_PLATFORMS.includes(p))
  return filtered.length ? filtered : ["web", "mobile"]
}

export const CMS_TONES = ["info", "promo", "warning"];

export const PLACEMENT_LABELS = {
  announcement_bar: "Announcement bar (above nav)",
  home_hero: "Home top — slider if multiple",
  home_mid: "Home mid section",
  home_end: "Home end section",
};
