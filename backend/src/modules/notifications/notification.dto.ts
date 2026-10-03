import { z } from "zod";

export const templateIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const patchNotificationTemplateDto = z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

export const createTemplateVersionDto = z.object({
    subject: z.string().nullable().optional(),
    content: z.string().min(1),
    variables: z.array(z.string()).optional(),
});

export const putUserPreferencesDto = z.object({
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    promotionalEmail: z.boolean().optional(),
    promotionalSms: z.boolean().optional(),
});
