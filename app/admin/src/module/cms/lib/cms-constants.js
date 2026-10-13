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

/** Announcement bar targeting (website editor + shared records). */
export const CMS_ANNOUNCEMENT_PLATFORMS = ["web", "mobile", "android"];

export const DEFAULT_ANNOUNCEMENT_PLATFORMS = ["web", "mobile", "android"];

export const CMS_PLATFORM_LABELS = {
  web: "Website",
  mobile: "Mobile web",
  android: "Android app",
  ios: "iOS app",
};

export function websitePlatformsOnly(platforms) {
  const list = Array.isArray(platforms) ? platforms : []
  const filtered = list.filter((p) => CMS_WEBSITE_PLATFORMS.includes(p))
  return filtered.length ? filtered : ["web", "mobile"]
}

export function announcementPlatformsForEdit(platforms, fallback = DEFAULT_ANNOUNCEMENT_PLATFORMS) {
  const list = Array.isArray(platforms) ? platforms : []
  const filtered = list.filter((p) => CMS_ANNOUNCEMENT_PLATFORMS.includes(p))
  return filtered.length ? filtered : [...fallback]
}

export function announcementPlatformsForSave(platforms) {
  const list = Array.isArray(platforms) ? platforms : []
  return list.filter((p) => CMS_ANNOUNCEMENT_PLATFORMS.includes(p))
}

/** Hero / mid / end banners — same channel pickers as announcements. */
export const CMS_BANNER_PLATFORMS = CMS_ANNOUNCEMENT_PLATFORMS
export const DEFAULT_BANNER_PLATFORMS = DEFAULT_ANNOUNCEMENT_PLATFORMS

export function bannerPlatformsForEdit(platforms, fallback = DEFAULT_BANNER_PLATFORMS) {
  return announcementPlatformsForEdit(platforms, fallback)
}

export function bannerPlatformsForSave(platforms) {
  return announcementPlatformsForSave(platforms)
}

export const CMS_TONES = ["info", "promo", "warning"];

export const PLACEMENT_LABELS = {
  announcement_bar: "Announcement bar (above nav)",
  home_hero: "Home top — slider if multiple",
  home_mid: "Home mid section",
  home_end: "Home end section",
};
