import { z } from 'zod';

export const signInSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit phone number')
    .max(10, 'Enter a valid 10-digit phone number')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
