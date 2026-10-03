import { z } from "zod";

export const registerPushDeviceDto = z.object({
    token: z.string().min(1),
    platform: z.enum(["android", "ios"]),
});

export const unregisterPushDeviceDto = z.object({
    token: z.string().min(1),
});

export const vendorNotificationIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const vendorNotificationsQueryDto = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type RegisterPushDeviceInput = z.infer<typeof registerPushDeviceDto>;
export type UnregisterPushDeviceInput = z.infer<typeof unregisterPushDeviceDto>;
export type VendorNotificationsQuery = z.infer<typeof vendorNotificationsQueryDto>;
