import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { _config } from "@/config/config.js";
import { EmailFactory } from "@/infrastructure/email/email.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type { AdminEmailChangeRepository } from "@/modules/identity/admin-account/admin-email-change.repository.js";
import { renderAdminEmailChangeEmail } from "@/modules/identity/admin-account/email/admin-email-change.render.js";
import type { z } from "zod";
import type {
    changeAdminEmailDto,
    changeAdminPasswordDto,
    patchAdminAccountProfileDto,
} from "@/modules/identity/admin-account/admin-account.dto.js";

type PatchProfile = z.infer<typeof patchAdminAccountProfileDto>;
type ChangePassword = z.infer<typeof changeAdminPasswordDto>;
type ChangeEmail = z.infer<typeof changeAdminEmailDto>;

const TOKEN_BYTES = 32;
const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
}

function isUniqueViolation(err: unknown): boolean {
    return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505";
}

export class AdminAccountService {
    constructor(
        private readonly users: IUserRepository,
        private readonly emailChanges: AdminEmailChangeRepository,
    ) {}

    async getAccount(userId: string) {
        const user = await this.users.findById(userId);
        if (!user || user.role !== "admin") {
            throw ApiError.notFound("Admin account not found");
        }
        const pending = await this.emailChanges.findLatestPendingForUser(userId);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            mustChangePassword: Boolean(user.mustChangePassword),
            pendingEmailChange: pending
                ? {
                      newEmail: pending.newEmail,
                      expiresAt: pending.expiresAt,
                      includesPassword: Boolean(pending.newPasswordHash),
                  }
                : null,
        };
    }

    async updateProfile(userId: string, input: PatchProfile) {
        const user = await this.assertAdmin(userId);
        await this.users.updateName(user.id, input.name);
        return this.getAccount(userId);
    }

    async changePassword(userId: string, input: ChangePassword) {
        const user = await this.assertAdmin(userId);
        await this.assertPassword(user, input.currentPassword);
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await this.users.updatePasswordHash(user.id, passwordHash);
        await this.users.setMustChangePassword(user.id, false);
        return this.getAccount(userId);
    }

    /** First-login bootstrap: admin keeps the current password and is not forced to Settings. */
    async skipPasswordSetup(userId: string) {
        const user = await this.assertAdmin(userId);
        if (user.mustChangePassword) {
            await this.users.setMustChangePassword(user.id, false);
        }
        return this.getAccount(userId);
    }

    async requestEmailChange(userId: string, input: ChangeEmail) {
        const user = await this.assertAdmin(userId);
        const newEmail = input.newEmail.trim().toLowerCase();
        const currentEmail = user.email?.trim().toLowerCase() ?? "";
        const emailChanging = newEmail !== currentEmail;

        if (emailChanging) {
            const existing = await this.users.findByEmail(newEmail);
            if (existing && existing.id !== user.id) {
                throw ApiError.conflict("Email is already in use");
            }
        }

        this.assertEmailConfigured();

        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

        await this.emailChanges.invalidatePendingForUser(user.id);
        await this.emailChanges.insert({
            userId: user.id,
            newEmail,
            tokenHash,
            expiresAt,
            newPasswordHash,
        });

        const base = (_config.ADMIN_APP_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
        const verifyUrl = `${base}/verify-email-change?token=${encodeURIComponent(rawToken)}`;
        const html = await renderAdminEmailChangeEmail({
            verifyUrl,
            newEmail,
            includesPassword: true,
        });
        await EmailFactory.getProvider().send({
            to: newEmail,
            subject: "Verify your Decory admin account",
            html,
            text: `Confirm your admin email and password: ${verifyUrl}`,
        });

        return this.getAccount(userId);
    }

    async confirmEmailChange(rawToken: string) {
        const tokenHash = hashToken(rawToken.trim());
        const anyRow = await this.emailChanges.findByTokenHash(tokenHash);
        if (!anyRow) {
            throw ApiError.badRequest("Invalid or expired verification link");
        }
        if (anyRow.usedAt) {
            return {
                email: anyRow.newEmail,
                passwordUpdated: Boolean(anyRow.newPasswordHash),
                alreadyVerified: true,
            };
        }
        const now = new Date();
        if (anyRow.expiresAt <= now) {
            throw ApiError.badRequest("This verification link has expired. Send a new one from Settings.");
        }
        const row = anyRow;
        const user = await this.users.findById(row.userId);
        if (!user || user.role !== "admin") {
            throw ApiError.badRequest("Invalid or expired verification link");
        }
        const taken = await this.users.findByEmail(row.newEmail);
        if (taken && taken.id !== user.id) {
            throw ApiError.conflict("Email is no longer available");
        }
        const currentEmail = user.email?.trim().toLowerCase() ?? "";
        const targetEmail = row.newEmail.trim().toLowerCase();
        if (targetEmail !== currentEmail) {
            try {
                await this.users.setEmail(user.id, row.newEmail);
            } catch (err) {
                if (isUniqueViolation(err)) {
                    throw ApiError.conflict("Email is already in use");
                }
                throw err;
            }
        }
        let passwordUpdated = false;
        if (row.newPasswordHash) {
            await this.users.updatePasswordHash(user.id, row.newPasswordHash);
            await this.users.setMustChangePassword(user.id, false);
            passwordUpdated = true;
        }
        await this.emailChanges.markUsed(row.id);
        return { email: row.newEmail, passwordUpdated };
    }

    private async assertAdmin(userId: string) {
        const user = await this.users.findById(userId);
        if (!user || user.role !== "admin") {
            throw ApiError.forbidden("admin only");
        }
        return user;
    }

    private async assertPassword(user: { passwordHash: string | null }, password: string) {
        if (!user.passwordHash) {
            throw ApiError.unauthorized("invalid credentials");
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            throw ApiError.unauthorized("invalid credentials");
        }
    }

    private assertEmailConfigured() {
        const provider = (_config.EMAIL_PROVIDER || "smtp").toLowerCase();
        if (provider !== "smtp") {
            throw new ApiError(503, "Email is not configured");
        }
        if (!_config.SMTP_HOST || !_config.SMTP_USER) {
            throw new ApiError(503, "Email is not configured");
        }
    }
}
