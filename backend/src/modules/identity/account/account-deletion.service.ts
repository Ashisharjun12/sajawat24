import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { ISessionService } from "@/modules/identity/sessions/session.service.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import { users } from "@/modules/identity/users/user.schema.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IConsumerAccountPurgeService } from "@/modules/identity/account/consumer-account-purge.service.js";

export interface IAccountDeletionService {
    deleteConsumerAccount(userId: string): Promise<void>;
}

function tombstoneEmail(userId: string): string {
    return `deleted+${userId}@accounts.internal`;
}

export class AccountDeletionService implements IAccountDeletionService {
    constructor(
        private readonly users: IUserRepository,
        private readonly vendors: IVendorRepository,
        private readonly sessions: ISessionService,
        private readonly purge: IConsumerAccountPurgeService,
    ) {}

    async deleteConsumerAccount(userId: string): Promise<void> {
        const user = await this.users.findById(userId);
        if (!user) {
            throw ApiError.notFound("user not found");
        }
        if (user.role !== "user") {
            throw ApiError.forbidden("only consumer accounts can be deleted from the app");
        }
        if (user.status === "deleted") {
            throw ApiError.conflict("account is already deleted");
        }

        const vendor = await this.vendors.findByUserId(userId);
        if (vendor) {
            throw ApiError.conflict("vendor accounts cannot be deleted from the consumer app");
        }

        await db.transaction(async (tx) => {
            const [row] = await tx
                .update(users)
                .set({
                    status: "deleted",
                    deletedAt: new Date(),
                    name: "Deleted user",
                    avatar: null,
                    phone: null,
                    googleId: null,
                    email: tombstoneEmail(userId),
                    updatedAt: new Date(),
                })
                .where(eq(users.id, userId))
                .returning({ id: users.id });
            if (!row) {
                throw ApiError.notFound("user not found");
            }
        });

        await this.purge.purgeUserData(userId);
        await this.sessions.revokeAllForUser(userId);
    }
}
