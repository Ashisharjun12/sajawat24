import { z } from "zod";

export const assignVendorDto = z.object({
    vendorId: z.string().uuid(),
});

export const assignCandidatesQueryDto = z.object({
    q: z.string().trim().optional(),
    samePin: z.enum(["true", "false"]).optional(),
});

export type AssignVendorInput = z.infer<typeof assignVendorDto>;
export type AssignCandidatesQuery = z.infer<typeof assignCandidatesQueryDto>;
