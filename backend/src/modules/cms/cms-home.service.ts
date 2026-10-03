import type { CmsBanner } from "@/modules/cms/banners/banner.schema.js";
import type { CmsTestimonial } from "@/modules/cms/testimonials/testimonial.schema.js";
import { matchesCmsPlatform } from "@/modules/cms/cms-platforms.js";

type ResolveRow = {
    id: string;
    placement: CmsBanner["placement"];
    cityId: string | null;
    platforms: string[];
    status: string;
    sortIndex: number;
    priority: number;
    startsAt: Date | null;
    endsAt: Date | null;
    title: string | null;
    subtitle: string | null;
    tag: string | null;
    imageUrl?: string | null;
    mobileImageUrl?: string | null;
    alt: string | null;
    ctaLabel: string | null;
    href: string | null;
    secondaryLabel: string | null;
    secondaryHref: string | null;
    message: string | null;
    tone: string | null;
    accentColor: string | null;
    dismissible: boolean;
    updatedAt: Date;
};

type TestimonialRow = {
    id: string;
    quote: string;
    reviewerName: string;
    reviewerCity: string | null;
    rating: number;
    accentColor: string | null;
    avatarUrl?: string | null;
    cityId: string | null;
    platforms: string[];
    status: string;
    sortIndex: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
};

function isPublished(row: { status: string; startsAt?: Date | null; endsAt?: Date | null }, at = new Date()) {
    if (row.status !== "published") return false;
    if (row.startsAt && row.startsAt > at) return false;
    if (row.endsAt && row.endsAt < at) return false;
    return true;
}

function sortByIndex(a: { sortIndex: number }, b: { sortIndex: number }) {
    return a.sortIndex - b.sortIndex;
}

function mergeCityPrepend<T extends { sortIndex: number; cityId: string | null }>(
    cityId: string | null | undefined,
    rows: T[],
) {
    const cityItems = rows.filter((row) => row.cityId && cityId && row.cityId === cityId);
    const globalItems = rows.filter((row) => !row.cityId);
    return [...cityItems.sort(sortByIndex), ...globalItems.sort(sortByIndex)];
}

function toHeroSlide(row: ResolveRow) {
    const title = row.title?.trim() || null;
    const tag = row.tag?.trim() || null;
    const subtitle = row.subtitle?.trim() || null;
    const ctaLabel = row.ctaLabel?.trim() || null;
    const secondaryLabel = row.secondaryLabel?.trim() || null;
    const href = row.href?.trim() || null;
    const secondaryHref = row.secondaryHref?.trim() || null;
    return {
        id: row.id,
        imageUrl: row.imageUrl ?? "",
        mobileImageUrl: row.mobileImageUrl ?? "",
        href,
        alt: row.alt?.trim() || title || "Banner",
        tag,
        title,
        subtitle,
        ctaLabel,
        secondaryLabel,
        secondaryHref,
    };
}

function toAnnouncement(row: ResolveRow) {
    return {
        id: row.id,
        message: row.message ?? "",
        href: row.href,
        tone: row.tone ?? "promo",
        accentColor: row.accentColor?.trim() || null,
        dismissible: row.dismissible,
    };
}

function toTestimonial(row: TestimonialRow) {
    return {
        id: row.id,
        quote: row.quote,
        name: row.reviewerName,
        role: row.reviewerCity ?? "",
        avatar: row.avatarUrl ?? "",
        rating: row.rating,
        accent: row.accentColor ?? "#7c5c12",
    };
}

type FaqRow = {
    id: string;
    question: string;
    answer: string;
    platforms: string[];
    status: string;
    sortIndex: number;
};

function toFaq(row: FaqRow) {
    return {
        id: row.id,
        question: row.question,
        answer: row.answer,
    };
}

export class CmsHomeService {
    resolve(
        banners: ResolveRow[],
        testimonials: TestimonialRow[],
        faqs: FaqRow[] = [],
        options: { cityId?: string | null; platform?: string } = {},
    ) {
        const platform = options.platform ?? "web";
        const cityId = options.cityId ?? null;
        const at = new Date();

        const eligibleBanners = banners.filter(
            (row) => isPublished(row, at) && matchesCmsPlatform(row.platforms, platform),
        );

        const announcementPool = eligibleBanners.filter((row) => row.placement === "announcement_bar");
        const cityAnnouncements = announcementPool.filter((row) => row.cityId && cityId && row.cityId === cityId);
        const globalAnnouncements = announcementPool.filter((row) => !row.cityId);
        const announcementSource = cityAnnouncements.length ? cityAnnouncements : globalAnnouncements;
        const announcements = announcementSource.sort(sortByIndex).map(toAnnouncement);
        const announcement = announcements[0] ?? null;

        function pickPlacement(placement: CmsBanner["placement"]) {
            const pool = eligibleBanners.filter((row) => row.placement === placement);
            return mergeCityPrepend(cityId, pool).map(toHeroSlide);
        }

        const testimonialPool = testimonials.filter(
            (row) => isPublished(row, at) && matchesCmsPlatform(row.platforms, platform),
        );
        const mergedTestimonials = mergeCityPrepend(cityId, testimonialPool).map(toTestimonial);

        const faqPool = faqs.filter(
            (row) => isPublished(row, at) && matchesCmsPlatform(row.platforms, platform),
        );
        const resolvedFaqs = faqPool.sort(sortByIndex).map(toFaq);

        return {
            announcements,
            announcement,
            hero: pickPlacement("home_hero"),
            mid: pickPlacement("home_mid"),
            end: pickPlacement("home_end"),
            testimonials: mergedTestimonials,
            faqs: resolvedFaqs,
        };
    }
}
