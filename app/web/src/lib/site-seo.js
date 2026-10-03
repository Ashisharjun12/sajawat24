import { WEB_URL } from "@/lib/env";

/**
 * Follow-ups (not in foundation slice): dynamic sitemap.xml, JSON-LD, prerender/SSR for PDP,
 * Search Console verification, product slug URLs.
 */

export const SITE_NAME = "Decorbuddys";

export const DEFAULT_DESCRIPTION =
  "Affordable decoration in your city—local prices for balloons, backdrops, and lights. Book online; instant decoration available where we serve.";

export const HOME_TITLE = "Affordable decoration in your city";

const META_DESCRIPTION_MAX = 160;

export function formatPageTitle(pageTitle, siteName = SITE_NAME) {
  const page = (pageTitle ?? "").trim();
  if (!page) return siteName;
  return `${page} · ${siteName}`;
}

export function truncateDescription(text, max = META_DESCRIPTION_MAX) {
  const value = (text ?? "").trim().replace(/\s+/g, " ");
  if (!value) return DEFAULT_DESCRIPTION;
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function canonicalUrl(pathname = "/") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const base = WEB_URL.replace(/\/$/, "");
  if (path === "/") return `${base}/`;
  return `${base}${path}`;
}

const NOINDEX_PREFIXES = ["/account", "/bag", "/login", "/checkout"];

export function shouldNoIndexPath(pathname) {
  return NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const ROUTE_SEO = [
  { prefix: "/", exact: true, title: HOME_TITLE, description: DEFAULT_DESCRIPTION },
  {
    prefix: "/explore",
    title: "Explore decorations",
    description: "Browse decoration themes and setups for your next celebration.",
  },
  {
    prefix: "/decorations",
    title: "All decorations",
    description: "Shop balloons, backdrops, lights, and full room setups by category.",
  },
  {
    prefix: "/cities",
    title: "Service cities",
    description: "See where Decorbuddys offers decoration booking and delivery.",
  },
  {
    prefix: "/offers",
    title: "Offers",
    description: "Current deals and promotions on home celebration décor.",
  },
  {
    prefix: "/c/",
    title: "Decoration category",
    description: "Browse decoration setups and book for your city.",
  },
  {
    prefix: "/p/",
    title: "Decoration setup",
    description: "View pricing, photos, and book this decoration for your home.",
  },
  {
    prefix: "/pages/",
    title: "Information",
    description: "Policies, help, and company information from Decorbuddys.",
  },
];

export function defaultSeoForPath(pathname) {
  if (shouldNoIndexPath(pathname)) {
    return {
      title: "Account",
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    };
  }

  const exactHome = ROUTE_SEO.find((row) => row.exact && row.prefix === pathname);
  if (exactHome) {
    return { title: exactHome.title, description: exactHome.description, noindex: false };
  }

  const prefixMatch = ROUTE_SEO.filter((row) => !row.exact).find((row) =>
    pathname.startsWith(row.prefix),
  );
  if (prefixMatch) {
    return {
      title: prefixMatch.title,
      description: prefixMatch.description,
      noindex: false,
    };
  }

  return {
    title: "Page not found",
    description: DEFAULT_DESCRIPTION,
    noindex: false,
  };
}
