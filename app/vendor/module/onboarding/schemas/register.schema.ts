import { z } from 'zod';

const phoneSchema = z
  .string()
  .min(10, 'Enter a valid 10-digit phone number')
  .max(10, 'Enter a valid 10-digit phone number')
  .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number');

export const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: phoneSchema,
  altPhone: z
    .string()
    .optional()
    .refine((value) => !value || value.length === 0 || phoneSchema.safeParse(value).success, {
      message: 'Enter a valid 10-digit phone number',
    }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
