import { DEMO_HOME_CATEGORIES } from "@/module/home/data/demo-home-categories";
import { DEMO_SECTION_META } from "@/module/home/data/demo-category-tree";
import { DEMO_PRODUCTS } from "@/module/home/data/demo-products";

const demoCategoryImageBySlug = new Map();

function indexDemoCategoryImages(nodes) {
  for (const node of nodes) {
    if (node?.slug && node.imageUrl) {
      demoCategoryImageBySlug.set(node.slug, node.imageUrl);
    }
    if (node?.children?.length) {
      indexDemoCategoryImages(node.children);
    }
  }
}

indexDemoCategoryImages(DEMO_HOME_CATEGORIES);

export function categoryImageUrl(category) {
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

export function normalizeCategory(raw) {
  if (!raw) return null;
  const children = Array.isArray(raw.children)
    ? raw.children.map(normalizeCategory).filter(Boolean)
    : [];

  let imageUrl = categoryImageUrl(raw);
  if (!imageUrl && raw.slug) {
    imageUrl = demoCategoryImageBySlug.get(raw.slug) ?? null;
  }

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    parentId: raw.parentId ?? null,
    iconKey: raw.iconKey ?? null,
    iconTone: raw.iconTone ?? null,
    imageUrl,
    tileBg: raw.tileBg ?? "bg-amber-50",
    children,
  };
}

export function normalizeCategoryTree(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map(normalizeCategory).filter(Boolean);
}

export function normalizeProduct(raw) {
  if (!raw) return null;
  const imageUrl =
    raw.imageUrl ??
    raw.images?.[0]?.url ??
    raw.images?.[0]?.optimizedUrl ??
    raw.images?.[0]?.publicUrl ??
    null;

  const pricePaise =
    raw.pricePaise ??
    raw.cityPricePaise ??
    raw.sellPricePaise ??
    0;

  const compareAtPaise =
    raw.compareAtPaise ??
    raw.cityCompareAtPaise ??
    null;

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    categoryId: raw.categoryId ?? null,
    pricePaise,
    compareAtPaise,
    rating:
      raw.ratingAvg != null
        ? Number(raw.ratingAvg)
        : raw.rating != null
          ? Number(raw.rating)
          : null,
    reviewCount: raw.reviewCount != null ? Number(raw.reviewCount) : null,
    tag: raw.tag ?? null,
    meta: raw.meta ?? null,
    sectionSlug: raw.sectionSlug ?? null,
    imageUrl,
    images: raw.images ?? (imageUrl ? [{ url: imageUrl }] : []),
    instant: raw.instant ?? null,
    scheduledEnabled: raw.scheduledEnabled ?? true,
  };
}

export function normalizeSection(raw) {
  if (!raw) return null;
  const items = Array.isArray(raw.items)
    ? raw.items.map(normalizeProduct).filter(Boolean)
    : [];

  return {
    id: raw.id ?? raw.slug,
    slug: raw.slug,
    name: raw.name,
    badgeColor: raw.badgeColor ?? "amber",
    badgeLabel: raw.badgeLabel ?? raw.name,
    sortIndex: raw.sortIndex ?? 0,
    items,
  };
}

export function getDemoCategories() {
  return normalizeCategoryTree(DEMO_HOME_CATEGORIES);
}

export function buildDemoSections() {
  const bySlug = new Map(
    DEMO_SECTION_META.map((meta) => [
      meta.slug,
      { ...meta, id: meta.slug, sortIndex: 0, items: [] },
    ]),
  );

  for (const product of DEMO_PRODUCTS) {
    const normalized = normalizeProduct(product);
    const section = bySlug.get(product.sectionSlug);
    if (section && normalized) {
      section.items.push(normalized);
    }
  }

  return [...bySlug.values()]
    .map(normalizeSection)
    .filter((section) => section && section.items.length > 0);
}

export function normalizeLayoutProducts(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeProduct).filter(Boolean);
}

export function normalizeApiSections(response) {
  const sections = response?.sections ?? response ?? [];
  if (!Array.isArray(sections) || sections.length === 0) return [];

  return sections
    .map((section) =>
      normalizeSection({
        id: section.id,
        slug: section.slug,
        name: section.name,
        badgeColor: section.badgeColor,
        badgeLabel: section.badgeLabel ?? section.name,
        sortIndex: section.sortIndex,
        items: section.items,
      }),
    )
    .filter((section) => section && section.items.length > 0);
}
