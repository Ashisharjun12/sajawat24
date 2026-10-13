import { z } from "zod";

const cmsAnnouncementToneSchema = z.enum(["info", "promo", "warning"]);

export const suggestCmsAnnouncementDto = z.object({
    topic: z.string().trim().min(2).max(200),
    message: z.string().trim().max(500).optional(),
    href: z.string().trim().max(500).optional(),
    tone: cmsAnnouncementToneSchema.optional(),
});

export type SuggestCmsAnnouncementInput = z.infer<typeof suggestCmsAnnouncementDto>;
