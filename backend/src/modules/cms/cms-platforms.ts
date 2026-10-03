import { z } from "zod";

export const CMS_PLATFORM_VALUES = ["web", "mobile", "android", "ios"] as const;

export type CmsPlatform = (typeof CMS_PLATFORM_VALUES)[number];

export const cmsPlatformSchema = z.enum(CMS_PLATFORM_VALUES);

export const cmsPlatformsSchema = z
    .array(cmsPlatformSchema)
    .min(1)
    .default(["web", "mobile"]);

export const cmsHomePlatformSchema = cmsPlatformSchema.default("web");

/** Legacy app rows may use `mobile` before android/ios existed (banners, announcements). */
export function matchesCmsPlatform(platforms: string[], platform: string): boolean {
    if (platform === "android") {
        return platforms.includes("android") || platforms.includes("mobile");
    }
    if (platform === "ios") {
        return platforms.includes("ios") || platforms.includes("mobile");
    }
    return platforms.includes(platform);
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
