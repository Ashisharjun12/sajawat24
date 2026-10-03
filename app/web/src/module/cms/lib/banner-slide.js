export function hasBannerOverlay(slide) {
  if (!slide) return false;
  return Boolean(
    slide.tag?.trim() ||
      slide.title?.trim() ||
      slide.subtitle?.trim() ||
      slide.ctaLabel?.trim() ||
      slide.secondaryLabel?.trim(),
  );
}

export function bannerImageForViewport(slide, preferMobile = false) {
  if (!slide) return "";
  const desktop = slide.imageUrl ?? slide.image?.url ?? "";
  const mobile = slide.mobileImageUrl ?? slide.mobileImage?.url ?? "";
  if (preferMobile) return mobile || desktop;
  return desktop;
}

export function normalizeHeroSlide(row) {
  return {
    id: row.id,
    imageUrl: row.imageUrl ?? row.image?.url ?? "",
    mobileImageUrl: row.mobileImageUrl ?? row.mobileImage?.url ?? "",
    href: row.href?.trim() ? row.href.trim() : null,
    alt: row.alt?.trim() || row.title?.trim() || "Banner",
    tag: row.tag?.trim() || null,
    title: row.title?.trim() || null,
    subtitle: row.subtitle?.trim() || null,
    ctaLabel: row.ctaLabel?.trim() || null,
    secondaryLabel: row.secondaryLabel?.trim() || null,
    secondaryHref: row.secondaryHref?.trim() || null,
  };
}
