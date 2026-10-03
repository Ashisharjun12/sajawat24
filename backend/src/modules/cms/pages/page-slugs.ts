export const CMS_PAGE_RESERVED_SLUGS = new Set([
    "account",
    "admin",
    "api",
    "bag",
    "bookings",
    "c",
    "checkout",
    "decorations",
    "login",
    "p",
    "pages",
    "settings",
    "support",
]);

export function normalizeCmsPageSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

export function assertCmsPageSlugAllowed(slug: string): void {
    if (slug.length < 2) {
        throw new Error("slug must be at least 2 characters");
    }
    if (CMS_PAGE_RESERVED_SLUGS.has(slug)) {
        throw new Error("slug is reserved");
    }
}
