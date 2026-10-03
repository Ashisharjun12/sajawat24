import { z } from "zod";

const defaultPriceFields = {
    pricePaise: z.number().int().positive().nullable().optional(),
    compareAtPaise: z.number().int().positive().nullable().optional(),
};

function defaultPriceOk(value: { pricePaise?: number | null; compareAtPaise?: number | null }) {
    if (value.pricePaise == null || value.compareAtPaise == null) return true;
    return value.compareAtPaise >= value.pricePaise;
}

export const productCopyPointsDto = z.array(z.string()).max(20).optional();
export const productCopyFaqsDto = z
    .array(
        z.object({
            question: z.string(),
            answer: z.string(),
        }),
    )
    .max(20)
    .optional();

const copyPointsDto = productCopyPointsDto;
const copyFaqsDto = productCopyFaqsDto;

export const createProductDto = z
    .object({
        name: z.string().min(2),
        slug: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        categoryId: z.string().uuid(),
        isActive: z.boolean().optional(),
        scheduledEnabled: z.boolean().optional(),
        instantEnabled: z.boolean().optional(),
        instantShowBadge: z.boolean().optional(),
        instantBadgeLabel: z.string().trim().max(40).nullable().optional(),
        instantPdpNote: z.string().trim().max(500).nullable().optional(),
        instantEtaMinutes: z.number().int().min(15).max(480).nullable().optional(),
        paymentCod: z.boolean().optional(),
        paymentOnline: z.boolean().optional(),
        imageUploadIds: z.array(z.string().uuid()).optional(),
        includes: copyPointsDto,
        deliverySetup: copyPointsDto,
        careInstructions: copyPointsDto,
        faqs: copyFaqsDto,
        ...defaultPriceFields,
    })
    .refine(defaultPriceOk, {
        message: "compareAtPaise must be greater than or equal to pricePaise",
        path: ["compareAtPaise"],
    });

export const patchProductDto = z
    .object({
        name: z.string().min(2).optional(),
        slug: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        categoryId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
        scheduledEnabled: z.boolean().optional(),
        instantEnabled: z.boolean().optional(),
        instantShowBadge: z.boolean().optional(),
        instantBadgeLabel: z.string().trim().max(40).nullable().optional(),
        instantPdpNote: z.string().trim().max(500).nullable().optional(),
        instantEtaMinutes: z.number().int().min(15).max(480).nullable().optional(),
        paymentCod: z.boolean().optional(),
        paymentOnline: z.boolean().optional(),
        imageUploadIds: z.array(z.string().uuid()).optional(),
        includes: copyPointsDto,
        deliverySetup: copyPointsDto,
        careInstructions: copyPointsDto,
        faqs: copyFaqsDto,
        ...defaultPriceFields,
    })
    .refine(defaultPriceOk, {
        message: "compareAtPaise must be greater than or equal to pricePaise",
        path: ["compareAtPaise"],
    });

export const productIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const productAddonParamsDto = z.object({
    id: z.string().uuid(),
    addonId: z.string().uuid(),
});

export const adminProductListQueryDto = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    categoryId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    price: z.enum(["none", "set", "sale"]).optional(),
});

export const publicProductListQueryDto = z
    .object({
        pincode: z.string().min(6).optional(),
        cityId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        categoryIds: z.string().optional(),
        minPricePaise: z.string().optional(),
        maxPricePaise: z.string().optional(),
        sort: z.enum(["popularity", "new", "price_asc", "price_desc"]).optional(),
        q: z.string().trim().min(1).max(80).optional(),
        instant: z.enum(["1"]).optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
    })
    .refine((value) => Boolean(value.pincode?.trim()) || Boolean(value.cityId), {
        message: "pincode or cityId is required",
        path: ["pincode"],
    });

export const publicProductGetQueryDto = z
    .object({
        pincode: z.string().min(6).optional(),
        cityId: z.string().uuid().optional(),
    })
    .refine((value) => Boolean(value.pincode?.trim()) || Boolean(value.cityId), {
        message: "pincode or cityId is required",
        path: ["pincode"],
    });

export const cityPriceDto = z
    .object({
        cityId: z.string().uuid(),
        pricePaise: z.number().int().positive(),
        compareAtPaise: z.number().int().positive().nullable().optional(),
    })
    .refine((value) => value.compareAtPaise == null || value.compareAtPaise >= value.pricePaise, {
        message: "compareAtPaise must be greater than or equal to pricePaise",
        path: ["compareAtPaise"],
    });

export const productCityPriceParamsDto = z.object({
    id: z.string().uuid(),
    cityId: z.string().uuid(),
});

export const mapAddonDto = z.object({
    addonId: z.string().uuid(),
});
