import { z } from "zod";

export const patchNotificationChannelsDto = z
    .object({
        sms: z.boolean().optional(),
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        inApp: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one channel is required",
    });

export const patchPaymentMethodsDto = z
    .object({
        razorpay: z.boolean().optional(),
        cashfree: z.boolean().optional(),
        cod: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one payment method is required",
    });

export const patchPayoutPolicyDto = z
    .object({
        platformCommissionPercent: z.number().min(0).max(50).optional(),
        codMaxDuePaise: z.number().int().min(0).optional(),
        settlementHoldDays: z.number().int().min(0).max(30).optional(),
        autoNetCodFromEarnings: z.boolean().optional(),
        minWithdrawalPaise: z.number().int().min(0).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one payout policy field is required",
    });

export const patchInstantDispatchDto = z
    .object({
        enabled: z.boolean().optional(),
        offerTtlSec: z.number().int().min(15).max(300).optional(),
        maxOffersPerOrder: z.number().int().min(1).max(20).optional(),
        radiusKmWaves: z.array(z.number().positive().max(50)).min(1).max(5).optional(),
        geoCount: z.number().int().min(5).max(100).optional(),
        heartbeatSec: z.number().int().min(10).max(120).optional(),
        staleSec: z.number().int().min(30).max(300).optional(),
        locationMinIntervalSec: z.number().int().min(2).max(60).optional(),
        locationMinMoveM: z.number().int().min(5).max(500).optional(),
        instantSlaMinutes: z.number().int().min(30).max(480).optional(),
        systemUserId: z.string().uuid().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one instant dispatch field is required",
    });

export const patchInstantMapsDto = z
    .object({
        customerAppMapEnabled: z.boolean().optional(),
        vendorAppMapEnabled: z.boolean().optional(),
        webMapEnabled: z.boolean().optional(),
        liveTrackingEnabled: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one instant maps field is required",
    });

export const patchInstantMarketplaceDto = z
    .object({
        enabled: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one instant marketplace field is required",
    });

export const patchDemoAuthDto = z
    .object({
        enabled: z.boolean().optional(),
        customerApp: z.boolean().optional(),
        vendorOwnerApp: z.boolean().optional(),
        vendorStaffApp: z.boolean().optional(),
    })
    .refine(
        (value) =>
            value.enabled !== undefined ||
            value.customerApp !== undefined ||
            value.vendorOwnerApp !== undefined ||
            value.vendorStaffApp !== undefined,
        { message: "at least one demo auth field is required" },
    );

export const patchBookingPolicyDto = z
    .object({
        acceptingBookings: z.boolean().optional(),
        operatingHoursStart: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .optional(),
        operatingHoursEnd: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .optional(),
        minLeadHours: z.number().int().min(0).max(72).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "at least one booking policy field is required",
    });
