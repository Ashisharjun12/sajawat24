import { normalizeAnnouncement } from "@/module/cms/lib/announcement-style";
import { normalizeHeroSlide } from "@/module/cms/lib/banner-slide";

function now() {
  return new Date();
}

function isPublished(row, at = now()) {
  if (row.status !== "published") return false;
  if (row.startsAt && new Date(row.startsAt) > at) return false;
  if (row.endsAt && new Date(row.endsAt) < at) return false;
  return true;
}

function matchesPlatform(row, platform) {
  const platforms = row.platforms ?? ["web", "mobile"];
  return platforms.includes(platform);
}

function matchesCity(row, cityId) {
  if (!row.cityId) return true;
  if (!cityId) return false;
  return row.cityId === cityId;
}

function sortByIndex(a, b) {
  return (a.sortIndex ?? 0) - (b.sortIndex ?? 0);
}

function mergeCityPrepend(cityItems, globalItems) {
  return [...cityItems.sort(sortByIndex), ...globalItems.sort(sortByIndex)];
}

function pickAnnouncements(rows, cityId, platform) {
  const eligible = rows.filter(
    (row) =>
      row.placement === "announcement_bar" &&
      isPublished(row) &&
      matchesPlatform(row, platform),
  );
  const cityRows = eligible.filter((row) => row.cityId && matchesCity(row, cityId));
  const globalRows = eligible.filter((row) => !row.cityId);
  const pool = cityRows.length ? cityRows : globalRows;
  return pool.sort(sortByIndex).map(normalizeAnnouncement);
}

function pickBanners(rows, placement, cityId, platform) {
  const eligible = rows.filter(
    (row) => row.placement === placement && isPublished(row) && matchesPlatform(row, platform),
  );
  const cityItems = eligible.filter((row) => row.cityId && matchesCity(row, cityId));
  const globalItems = eligible.filter((row) => !row.cityId);
  return mergeCityPrepend(cityItems, globalItems);
}

function toHeroSlide(row) {
  return normalizeHeroSlide(row);
}

function toTestimonialCard(row) {
  return {
    id: row.id,
    quote: row.quote,
    name: row.reviewerName,
    role: row.reviewerCity ?? "",
    avatar: row.avatarUrl ?? row.avatar?.url ?? "",
    rating: row.rating ?? 5,
    accent: row.accentColor ?? "#7c5c12",
  };
}

export function resolveHomeCms({ banners = [], testimonials = [] }, { cityId = null, platform = "web" } = {}) {
  const announcements = pickAnnouncements(banners, cityId, platform);
  const announcement = announcements[0] ?? null;
  const hero = pickBanners(banners, "home_hero", cityId, platform).map(toHeroSlide);
  const mid = pickBanners(banners, "home_mid", cityId, platform).map(toHeroSlide);
  const end = pickBanners(banners, "home_end", cityId, platform).map(toHeroSlide);

  const testimonialRows = testimonials
    .filter((row) => isPublished(row) && matchesPlatform(row, platform))
    .filter((row) => {
      if (!row.cityId) return true;
      return cityId ? matchesCity(row, cityId) : false;
    });

  const globalTestimonials = testimonials.filter(
    (row) => isPublished(row) && matchesPlatform(row, platform) && !row.cityId,
  );

  const mergedTestimonials = mergeCityPrepend(testimonialRows, globalTestimonials).map(toTestimonialCard);

  return {
    announcements,
    announcement,
    hero,
    mid,
    end,
    testimonials: mergedTestimonials,
  };
}

