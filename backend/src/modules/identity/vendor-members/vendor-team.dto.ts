import { z } from "zod";

export const listTeamQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    q: z.string().trim().max(80).optional(),
    status: z.enum(["active", "invited", "disabled"]).optional(),
});

export const inviteTeamMemberDto = z.object({
    phone: z.string().min(10),
    displayName: z.string().trim().min(1).max(80),
});

export const teamMemberIdParamsDto = z.object({
    memberId: z.string().uuid(),
});

export const patchTeamMemberDto = z.object({
    displayName: z.string().trim().min(1).max(80).optional(),
    status: z.enum(["active", "disabled"]).optional(),
});

export const putJobAssignmentsDto = z.object({
    memberIds: z.array(z.string().uuid()).max(1, "only one worker per job"),
});
