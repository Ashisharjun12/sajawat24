export const APP_BANNER_SCREEN_LINKS = [
  { id: "home", label: "Home", href: "/(app)" },
  { id: "explore", label: "Explore", href: "/(app)/explore" },
  { id: "category", label: "Category tab", href: "/(app)/category" },
  { id: "instant", label: "Instant", href: "/(app)/instant" },
  { id: "search", label: "Search", href: "/(app)/search" },
]

export function inferAppBannerLinkType(href) {
  const value = href?.trim() ?? ""
  if (!value) return "none"
  if (APP_BANNER_SCREEN_LINKS.some((row) => row.href === value)) return "screen"
  if (/^\/\(app\)\/product\/[^/?#]+/.test(value)) return "product"
  if (/^\/c\/[^/?#]+/.test(value)) return "category"
  return "custom"
}

export function parseCategoryHref(href) {
  const value = href?.trim() ?? ""
  const two = value.match(/^\/c\/([^/?#]+)\/([^/?#]+)/)
  if (two) return { parentSlug: two[1], childSlug: two[2] }
  const one = value.match(/^\/c\/([^/?#]+)/)
  if (one) return { parentSlug: one[1], childSlug: "" }
  return { parentSlug: "", childSlug: "" }
}

export function buildCategoryHref(parentSlug, childSlug) {
  const parent = parentSlug?.trim()
  const child = childSlug?.trim()
  if (!parent) return ""
  if (child) return `/c/${parent}/${child}`
  return `/c/${parent}`
}

export function productHrefFromId(productId) {
  return productId ? `/(app)/product/${productId}` : ""
}

export function productIdFromHref(href) {
  const value = href?.trim() ?? ""
  const match = value.match(/^\/\(app\)\/product\/([^/?#]+)/)
  return match?.[1] ?? ""
}

export function linkPreviewLabel(href) {
  const value = href?.trim()
  if (!value) return ""
  const screen = APP_BANNER_SCREEN_LINKS.find((row) => row.href === value)
  if (screen) return screen.label
  const productId = productIdFromHref(value)
  if (productId) return `Product ${productId.slice(0, 8)}…`
  const { parentSlug, childSlug } = parseCategoryHref(value)
  if (parentSlug) {
    return childSlug ? `Category: ${parentSlug} / ${childSlug}` : `Category: ${parentSlug}`
  }
  return value
}
