import { z } from "zod";

export const patchAdminAccountProfileDto = z.object({
    name: z.string().trim().min(1).max(120),
});

export const changeAdminPasswordDto = z
    .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
        confirmNewPassword: z.string().min(8).max(128),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "passwords do not match",
        path: ["confirmNewPassword"],
    });

/** Email verification link also applies the new password (no current password required). */
export const changeAdminEmailDto = z
    .object({
        newEmail: z.string().trim().email().max(200),
        newPassword: z.string().min(8).max(128),
        confirmNewPassword: z.string().min(8).max(128),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "passwords do not match",
        path: ["confirmNewPassword"],
    });

export const verifyEmailChangeQueryDto = z.object({
    token: z.string().trim().min(16).max(200),
});
