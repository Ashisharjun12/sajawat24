import { z } from "zod";

export const CMS_PLATFORM_VALUES = ["web", "mobile", "android", "ios"] as const;

export type CmsPlatform = (typeof CMS_PLATFORM_VALUES)[number];

export const cmsPlatformSchema = z.enum(CMS_PLATFORM_VALUES);

export const cmsPlatformsSchema = z
    .array(cmsPlatformSchema)
    .min(1)
    .default(["web", "mobile"]);

export const cmsHomePlatformSchema = cmsPlatformSchema.default("web");

/** Admin banner list filter (`android_only` = rows with explicit android). */
export const CMS_ADMIN_BANNER_PLATFORM_FILTER_VALUES = [
    ...CMS_PLATFORM_VALUES,
    "android_only",
] as const;

export const cmsAdminBannerPlatformFilterSchema = z.enum(CMS_ADMIN_BANNER_PLATFORM_FILTER_VALUES);

/** Announcement bar: Android/iOS must be explicitly checked in admin. */
export function matchesCmsAnnouncementPlatform(platforms: string[], platform: string): boolean {
    if (platform === "android") {
        return platforms.includes("android");
    }
    if (platform === "ios") {
        return platforms.includes("ios");
    }
    return platforms.includes(platform);
}

/** Hero / mid / end banners: each surface must be explicitly checked in admin. */
export function matchesCmsBannerPlatform(platforms: string[], platform: string): boolean {
    return matchesCmsAnnouncementPlatform(platforms, platform);
}

/** Testimonials, FAQs, and other non-banner CMS rows (same rules as announcements). */
export function matchesCmsPlatform(platforms: string[], platform: string): boolean {
    return matchesCmsAnnouncementPlatform(platforms, platform);
}

/** Homepage layout blocks: native apps only see explicit android/ios rows (not web/mobile). */
export function matchesCmsHomeLayoutPlatform(platforms: string[], platform: string): boolean {
    if (platform === "android") {
        return platforms.includes("android");
    }
    if (platform === "ios") {
        return platforms.includes("ios");
    }
    return matchesCmsPlatform(platforms, platform);
}
