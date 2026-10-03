export const CONTENT_CHANNELS = ["web", "mobile", "android", "ios"]

export const WEBSITE_CHANNELS = ["web", "mobile"]

export const APP_CHANNELS = ["android", "ios"]

export const WEB_TABS = [
  "announcements",
  "banners",
  "homepage",
  "testimonials",
  "faq",
]

export const APP_TABS = ["announcements", "banners", "homepage"]

export function normalizeChannel(value) {
  return CONTENT_CHANNELS.includes(value) ? value : "web"
}

export function normalizeWebTab(value) {
  return WEB_TABS.includes(value) ? value : "announcements"
}

export function normalizeAppTab(value) {
  return APP_TABS.includes(value) ? value : "announcements"
}

export function channelSubtitle(channel) {
  switch (channel) {
    case "web":
      return "Manage announcements, banners, homepage layout, testimonials, and FAQs for the website."
    case "mobile":
      return "Same website content as Web — how it appears in the mobile browser (mweb)."
    case "android":
      return "Customer Android app home — announcements, banners, and homepage layout."
    case "ios":
      return "Customer iOS app home — coming soon."
    default:
      return ""
  }
}

/**
 * Build search params for Content page navigation.
 */
export function contentSearchParams({ channel, tab, atab }) {
  const next = new URLSearchParams()
  const ch = normalizeChannel(channel)
  if (ch !== "web") {
    next.set("channel", ch)
  }
  if (WEBSITE_CHANNELS.includes(ch)) {
    next.set("tab", normalizeWebTab(tab))
  } else {
    next.set("atab", normalizeAppTab(atab ?? tab))
  }
  return next
}

export function parseContentParams(searchParams) {
  const rawChannel = searchParams.get("channel")
  const channel = rawChannel
    ? normalizeChannel(rawChannel)
    : "web"
  const tab = normalizeWebTab(searchParams.get("tab"))
  const atab = normalizeAppTab(
    searchParams.get("atab") ?? searchParams.get("tab"),
  )
  return { channel, tab, atab }
}
