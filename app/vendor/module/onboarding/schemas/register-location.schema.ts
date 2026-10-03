import { z } from 'zod';

export const registerLocationSchema = z.object({
  state: z.string().min(1, 'Select a state'),
  cityId: z.string().min(1, 'Select a city'),
  shopAddress: z.string().trim().min(10, 'Enter your shop address'),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  shopImageUri: z.string().optional(),
  baseLatitude: z.number().min(-90).max(90).optional(),
  baseLongitude: z.number().min(-180).max(180).optional(),
}).refine((data) => data.baseLatitude != null && data.baseLongitude != null, {
  message: 'Add your shop on the map',
  path: ['baseLatitude'],
});

export type RegisterLocationFormValues = z.infer<typeof registerLocationSchema>;
