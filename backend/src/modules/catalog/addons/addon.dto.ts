import { z } from "zod";

const defaultPriceFields = {
    pricePaise: z.number().int().nonnegative().nullable().optional(),
    compareAtPaise: z.number().int().positive().nullable().optional(),
};

function defaultPriceOk(value: { pricePaise?: number | null; compareAtPaise?: number | null }) {
    if (value.pricePaise == null || value.compareAtPaise == null) return true;
    return value.compareAtPaise >= value.pricePaise;
}

export const createAddonDto = z
    .object({
        name: z.string().min(2),
        slug: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        imageUploadId: z.string().uuid().nullable().optional(),
        colorId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
        maxQuantity: z.number().int().min(1).max(20).optional(),
        ...defaultPriceFields,
    })
    .refine(defaultPriceOk, {
        message: "compareAtPaise must be greater than or equal to pricePaise",
        path: ["compareAtPaise"],
    });

export const patchAddonDto = z
    .object({
        name: z.string().min(2).optional(),
        slug: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        imageUploadId: z.string().uuid().nullable().optional(),
        colorId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
        maxQuantity: z.number().int().min(1).max(20).optional(),
        ...defaultPriceFields,
    })
    .refine(defaultPriceOk, {
        message: "compareAtPaise must be greater than or equal to pricePaise",
        path: ["compareAtPaise"],
    });

const addonColorHex = z.string().trim().regex(/^#([0-9a-fA-F]{6})$/);

export const createAddonColorDto = z.object({
    name: z.string().trim().min(2).max(40),
    hex: addonColorHex,
});

export const patchAddonColorDto = z
    .object({
        name: z.string().trim().min(2).max(40).optional(),
        hex: addonColorHex.optional(),
    })
    .refine((value) => value.name !== undefined || value.hex !== undefined, {
        message: "name or hex is required",
    });

export const addonColorIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const addonIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const addonCityPriceParamsDto = z.object({
    id: z.string().uuid(),
    cityId: z.string().uuid(),
});

export const adminAddonListQueryDto = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
});

export const addonCityPriceDto = z
    .object({
        cityId: z.string().uuid(),
        pricePaise: z.number().int().nonnegative(),
        compareAtPaise: z.number().int().positive().nullable().optional(),
    })
    .refine((value) => value.compareAtPaise == null || value.compareAtPaise >= value.pricePaise, {
        message: "compareAtPaise must be greater than or equal to pricePaise",
        path: ["compareAtPaise"],
    });
