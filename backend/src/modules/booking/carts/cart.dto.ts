import { z } from "zod";

const cartAddonSelectionDto = z.object({
    addonId: z.string().uuid(),
    quantity: z.number().int().positive().max(20),
});

export const addCartItemDto = z
    .object({
    productId: z.string().uuid(),
    addonIds: z.array(z.string().uuid()).optional(),
    addons: z.array(cartAddonSelectionDto).optional(),
    quantity: z.number().int().positive().max(20).optional(),
    cityId: z.string().uuid().optional(),
    pincode: z.string().min(6).max(6).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    fulfillmentType: z.enum(["scheduled", "instant"]).optional(),
})
    .refine((value) => !(value.addonIds?.length && value.addons?.length), {
        message: "use addonIds or addons, not both",
        path: ["addons"],
    });

export const patchCartItemDto = z.object({
    quantity: z.number().int().positive().max(20),
});

export const cartItemIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const cartDeliveryGeoDto = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export const cartLocationDto = z
    .object({
        pincode: z.string().min(6).max(6).optional(),
        cityId: z.string().uuid().optional(),
    })
    .refine((value) => Boolean(value.pincode?.trim()) || Boolean(value.cityId), {
        message: "pincode or cityId is required",
        path: ["pincode"],
    });
