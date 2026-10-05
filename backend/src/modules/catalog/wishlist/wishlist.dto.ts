import { z } from "zod";

export const WISHLIST_MAX_ITEMS = 100;

export const wishlistLocationQueryDto = z
    .object({
        pincode: z.string().min(6).max(6).optional(),
        cityId: z.string().uuid().optional(),
    })
    .refine((value) => Boolean(value.pincode?.trim()) || Boolean(value.cityId), {
        message: "pincode or cityId is required",
    });

export const addWishlistItemDto = z.object({
    productId: z.string().uuid(),
});

export const mergeWishlistDto = z.object({
    productIds: z.array(z.string().uuid()).max(200),
});

export const wishlistProductIdParamsDto = z.object({
    productId: z.string().uuid(),
});
