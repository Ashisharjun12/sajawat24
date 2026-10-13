import { z } from "zod";

export const cmsAnnouncementOutputSchema = z.object({
    message: z.string().min(5).max(500),
    href: z.string().max(500).optional(),
    tone: z.enum(["info", "promo", "warning"]),
});

export type CmsAnnouncementOutput = z.infer<typeof cmsAnnouncementOutputSchema>;
