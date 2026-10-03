export type HomeProductInstant = {
  enabled: boolean;
  showBadge: boolean;
  badgeLabel: string;
  pdpNote?: string | null;
  etaMinutes: number | null;
};

export type HomeCatalogProduct = {
  id: string;
  title: string;
  imageUrl: string | null;
  categoryId?: string | null;
  pricePaise: number;
  compareAtPaise?: number | null;
  rating: number | null;
  reviewCount: number | null;
  instant?: HomeProductInstant | null;
  slotHint?: string | null;
};

export type HomeProductSection = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  badgeLabel?: string | null;
  badgeColor?: string | null;
  items: HomeCatalogProduct[];
};

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  iconKey?: string | null;
  iconTone?: string | null;
  imageUrl?: string | null;
  children?: HomeCategory[];
};

export type HomeCmsLayoutBlock = {
  id: string;
  type: 'category_row' | 'product_rail';
  title?: string | null;
  subtitle?: string | null;
  showTitle?: boolean;
  showSubtitle?: boolean;
  maxVisible?: number;
  showViewAll?: boolean;
  viewAllHref?: string | null;
  enableDrillDown?: boolean;
  sectionSlug?: string | null;
  sectionName?: string | null;
  badgeColor?: string | null;
  categories?: unknown[];
  items?: unknown[];
};

export const HOME_CATEGORY_PREVIEW_COUNT = 6;

/** Dev/admin placeholder names — hide from browse and search suggestions. */
export function isPlaceholderCategoryName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length === 0 || /^category\d*$/i.test(trimmed);
}

export function filterCategoriesForDisplay(categories: HomeCategory[]): HomeCategory[] {
  return categories
    .filter((c) => !isPlaceholderCategoryName(c.name))
    .map((c) => ({
      ...c,
      children: (c.children ?? []).filter((ch) => !isPlaceholderCategoryName(ch.name)),
    }));
}

export function categoryImageUrl(category: {
  imageUrl?: string | null;
  image?: { url?: string; thumbnailUrl?: string; optimizedUrl?: string; publicUrl?: string };
}): string | null {
  if (!category) return null;
  const image = category.image;
  return (
    category.imageUrl ??
    image?.url ??
    image?.thumbnailUrl ??
    image?.optimizedUrl ??
    image?.publicUrl ??
    null
  );
}

export function normalizeCategory(raw: unknown): HomeCategory | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (!row.id || !row.name) return null;
  const category: HomeCategory = {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug ?? row.id),
    iconKey: (row.iconKey as string) ?? 'sparkles',
    iconTone: (row.iconTone as string) ?? null,
    imageUrl: categoryImageUrl(row as Parameters<typeof categoryImageUrl>[0]),
  };
  const childRows = row.children;
  if (Array.isArray(childRows) && childRows.length > 0) {
    category.children = childRows
      .map((child) => normalizeCategory(child))
      .filter(Boolean) as HomeCategory[];
  }
  return category;
}

export function normalizeCategoryTree(items: unknown): HomeCategory[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeCategory(item)).filter(Boolean) as HomeCategory[];
}

export function normalizeLayoutProducts(items: unknown): HomeCatalogProduct[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeProduct).filter(Boolean) as HomeCatalogProduct[];
}

export function cmsLayoutHasProductRails(blocks: HomeCmsLayoutBlock[]): boolean {
  return blocks.some(
    (block) =>
      block.type === 'product_rail' && normalizeLayoutProducts(block.items).length > 0,
  );
}

export function normalizeProduct(raw: unknown): HomeCatalogProduct | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (!row.id || !row.name) return null;

  const images = row.images as { url?: string; optimizedUrl?: string; publicUrl?: string }[] | undefined;
  const imageUrl =
    (row.imageUrl as string) ??
    images?.[0]?.url ??
    images?.[0]?.optimizedUrl ??
    images?.[0]?.publicUrl ??
    null;

  const pricePaise =
    (row.pricePaise as number) ??
    (row.cityPricePaise as number) ??
    (row.sellPricePaise as number) ??
    0;

  const compareRaw =
    (row.compareAtPaise as number | null | undefined) ??
    (row.cityCompareAtPaise as number | null | undefined);
  const compareAtPaise =
    compareRaw != null && Number.isFinite(Number(compareRaw)) ? Number(compareRaw) : null;

  const ratingRaw = row.ratingAvg ?? row.rating;
  const rating = ratingRaw != null ? Number(ratingRaw) : null;
  const reviewCount = row.reviewCount != null ? Number(row.reviewCount) : null;

  let instant: HomeProductInstant | null = null;
  const instantRaw = row.instant;
  if (instantRaw && typeof instantRaw === 'object') {
    const block = instantRaw as Record<string, unknown>;
    instant = {
      enabled: Boolean(block.enabled),
      showBadge: Boolean(block.showBadge),
      badgeLabel: String(block.badgeLabel ?? 'Instant'),
      pdpNote: (block.pdpNote as string) ?? null,
      etaMinutes:
        block.etaMinutes != null && Number.isFinite(Number(block.etaMinutes))
          ? Number(block.etaMinutes)
          : null,
    };
  } else if (row.instantEnabled === true || instantRaw === true) {
    instant = {
      enabled: true,
      showBadge: row.instantShowBadge !== false,
      badgeLabel: String(row.instantBadgeLabel ?? 'Instant'),
      pdpNote: null,
      etaMinutes:
        row.instantEtaMinutes != null && Number.isFinite(Number(row.instantEtaMinutes))
          ? Number(row.instantEtaMinutes)
          : null,
    };
  }

  const categoryIdRaw = row.categoryId;
  const categoryId =
    categoryIdRaw != null && String(categoryIdRaw).trim()
      ? String(categoryIdRaw)
      : null;

  return {
    id: String(row.id),
    title: String(row.name),
    imageUrl,
    categoryId,
    pricePaise,
    compareAtPaise,
    rating: Number.isFinite(rating) ? rating : null,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : null,
    instant,
    slotHint: (row.meta as string) ?? null,
  };
}

export function normalizeSection(raw: unknown): HomeProductSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const items = Array.isArray(row.items)
    ? row.items.map(normalizeProduct).filter(Boolean)
    : [];
  const typedItems = items as HomeCatalogProduct[];
  if (typedItems.length === 0) return null;

  const name = row.name != null ? String(row.name) : '';
  const badgeLabelRaw = row.badgeLabel ?? name;
  const badgeLabel = badgeLabelRaw ? String(badgeLabelRaw) : undefined;

  return {
    id: String(row.id ?? row.slug),
    slug: String(row.slug ?? row.id),
    title: name || badgeLabel || 'Picks for you',
    subtitle: undefined,
    badgeLabel,
    badgeColor: row.badgeColor != null ? String(row.badgeColor) : undefined,
    items: typedItems,
  };
}

export function normalizeApiSections(response: unknown): HomeProductSection[] {
  const payload = response as { sections?: unknown } | unknown[];
  const sections = Array.isArray(payload) ? payload : payload?.sections;
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => {
      const row = section as Record<string, unknown>;
      return normalizeSection({
        id: row.id,
        slug: row.slug,
        name: row.name,
        badgeColor: row.badgeColor,
        badgeLabel: row.badgeLabel ?? row.name,
        items: row.items,
      });
    })
    .filter(Boolean) as HomeProductSection[];
}

export type HomeBannerSlide = {
  id: string;
  imageUrl: string;
  alt: string;
  href?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
};

type HeroRow = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  alt?: string | null;
  href?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  image?: { url?: string };
  mobileImage?: { url?: string };
};

function mapHeroRowToSlide(row: HeroRow): HomeBannerSlide | null {
  const desktop = row.imageUrl ?? row.image?.url ?? '';
  const mobile = row.mobileImageUrl ?? row.mobileImage?.url ?? '';
  const imageUrl = mobile || desktop;
  if (!imageUrl) return null;
  const title = row.title?.trim() || null;
  const subtitle = row.subtitle?.trim() || null;
  const ctaLabel = row.ctaLabel?.trim() || null;
  return {
    id: String(row.id),
    imageUrl,
    alt: row.alt?.trim() || title || 'Banner',
    href: row.href?.trim() || null,
    title,
    subtitle,
    ctaLabel,
  };
}

function normalizePromoSlide(row: HeroRow | null | undefined): HomeBannerSlide | null {
  if (!row?.id) return null;
  return mapHeroRowToSlide(row);
}

export type NormalizedHomeCms = {
  heroSlides: HomeBannerSlide[];
  layoutBlocks: HomeCmsLayoutBlock[];
  midSlide: HomeBannerSlide | null;
  endSlide: HomeBannerSlide | null;
};

export function normalizeHomeCms(remote: unknown): NormalizedHomeCms {
  if (!remote || typeof remote !== 'object') {
    return { heroSlides: [], layoutBlocks: [], midSlide: null, endSlide: null };
  }
  const payload = remote as {
    hero?: HeroRow[];
    layoutBlocks?: HomeCmsLayoutBlock[];
    mid?: HeroRow[];
    end?: HeroRow[];
  };
  const layoutBlocks = Array.isArray(payload.layoutBlocks)
    ? payload.layoutBlocks.filter((b) => b?.id && b?.type)
    : [];
  return {
    heroSlides: normalizeHomeCmsHero(remote),
    layoutBlocks,
    midSlide: normalizePromoSlide(payload.mid?.[0]),
    endSlide: normalizePromoSlide(payload.end?.[0]),
  };
}

/** Mobile home hero: CMS `platform=mobile` banners, prefer mobile artwork (web parity). */
export function normalizeHomeCmsHero(remote: unknown): HomeBannerSlide[] {
  if (!remote || typeof remote !== 'object') return [];
  const hero = (remote as { hero?: HeroRow[] }).hero;
  if (!Array.isArray(hero)) return [];

  return hero.map((row) => mapHeroRowToSlide(row)).filter(Boolean) as HomeBannerSlide[];
}
