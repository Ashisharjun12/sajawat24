import { z } from "zod";

const phoneSchema = z
    .string()
    .min(10)
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^[6-9]\d{9}$/.test(value) || /^91[6-9]\d{9}$/.test(value), {
        message: "invalid phone number",
    });

export const vendorRegisterDto = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: phoneSchema,
    altPhone: phoneSchema.optional(),
    cityId: z.string().uuid(),
    shopAddress: z.string().trim().min(10),
    pincode: z
        .string()
        .trim()
        .regex(/^[1-9]\d{5}$/, "invalid pincode"),
    shopImageUploadId: z.string().uuid().optional(),
    baseLatitude: z.coerce.number().min(-90).max(90).optional(),
    baseLongitude: z.coerce.number().min(-180).max(180).optional(),
    baseGeoSource: z
        .enum([
            "geocode_google",
            "geocode_ola",
            "place_pin",
            "geocode_manual",
            "pincode_centroid",
            "device",
        ])
        .optional(),
    androidAppHash: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9+/=]{11}$/, "invalid android app hash")
        .optional(),
});

export const vendorPresignShopImageDto = z.object({
    phone: phoneSchema,
    fileName: z.string().min(1),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export const vendorCompleteShopImageParamsDto = z.object({
    uploadId: z.string().uuid(),
});

export const adminVendorListQueryDto = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(["PENDING", "ACTIVE", "REJECTED", "BLOCKED"]).optional(),
    search: z.string().trim().optional(),
    cityId: z.string().uuid().optional(),
    isOnDuty: z.preprocess(
        (value) => (value === "true" ? true : value === "false" ? false : undefined),
        z.boolean().optional(),
    ),
    joinedFrom: z.coerce.date().optional(),
    joinedTo: z.coerce.date().optional(),
});

export const adminVendorIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const adminVendorMembersQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().max(80).optional(),
    status: z.enum(["active", "invited", "disabled"]).optional(),
});

export const adminVendorPatchDto = z.object({
    onboardingStatus: z.enum(["ACTIVE", "REJECTED", "BLOCKED"]),
});

export const vendorReapplyDto = vendorRegisterDto.omit({ phone: true, androidAppHash: true });

export const vendorDutyPatchDto = z.object({
    isOnDuty: z.boolean(),
});

export const vendorPresignAvatarDto = z.object({
    fileName: z.string().min(1),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export const vendorCompleteAvatarParamsDto = z.object({
    uploadId: z.string().uuid(),
});

export const vendorProfilePatchDto = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    avatarUploadId: z.string().uuid().optional(),
});

export type VendorRegisterInput = z.infer<typeof vendorRegisterDto>;
export type VendorDutyPatchInput = z.infer<typeof vendorDutyPatchDto>;
export type VendorReapplyInput = z.infer<typeof vendorReapplyDto>;
export type VendorProfilePatchInput = z.infer<typeof vendorProfilePatchDto>;
export type AdminVendorListQuery = z.infer<typeof adminVendorListQueryDto>;
