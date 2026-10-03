import { z } from "zod";

const pincodeSchema = z
    .string()
    .trim()
    .regex(/^\d{6}$/, "pincode must be 6 digits");

export const customerAddressIdParamsDto = z.object({
    id: z.string().uuid(),
});

const geoSourceSchema = z.enum([
    "geocode_google",
    "geocode_manual",
    "pincode_centroid",
    "device",
]);

export const createCustomerAddressDto = z.object({
    label: z.string().trim().min(1).max(80),
    address: z.string().trim().min(6).max(500),
    landmark: z.string().trim().max(200).optional(),
    pincode: pincodeSchema,
    cityName: z.string().trim().min(1).max(120).optional(),
    cityId: z.string().uuid(),
    setDefault: z.boolean().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    geoSource: geoSourceSchema.optional(),
});

export const patchCustomerAddressDto = z.object({
    label: z.string().trim().min(1).max(80).optional(),
    address: z.string().trim().min(6).max(500).optional(),
    landmark: z.string().trim().max(200).nullable().optional(),
    pincode: pincodeSchema.optional(),
    cityName: z.string().trim().min(1).max(120).optional(),
    cityId: z.string().uuid().nullable().optional(),
    setDefault: z.boolean().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    geoSource: geoSourceSchema.optional(),
});

export type CreateCustomerAddressInput = z.infer<typeof createCustomerAddressDto>;
export type PatchCustomerAddressInput = z.infer<typeof patchCustomerAddressDto>;
