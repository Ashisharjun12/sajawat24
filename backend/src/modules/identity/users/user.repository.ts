import { count, eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    users,
    type NewUser,
    type User,
    type UserRole,
    type UserStatus,
} from "@/modules/identity/users/user.schema.js";

export interface IUserRepository {
    findById(id: string): Promise<User | undefined>;
    findByPhone(phone: string): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    findByGoogleId(googleId: string): Promise<User | undefined>;
    create(data: NewUser): Promise<User>;
    markPhoneVerified(id: string): Promise<void>;
    linkGoogleId(id: string, googleId: string): Promise<User>;
    linkPhone(id: string, phone: string): Promise<User>;
    linkGoogleProfile(
        id: string,
        input: { googleId: string; email?: string | null; avatar?: string | null },
    ): Promise<User>;
    setAvatar(id: string, avatar: string): Promise<User>;
    updateProfile(id: string, input: { name: string; email: string }): Promise<User>;
    updateName(id: string, name: string): Promise<void>;
    setEmail(id: string, email: string): Promise<User>;
    updateStatus(id: string, status: UserStatus): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    countByRole(role: UserRole): Promise<number>;
    updatePasswordHash(id: string, passwordHash: string): Promise<void>;
    setMustChangePassword(id: string, value: boolean): Promise<void>;
}

export class UserRepository implements IUserRepository {
    async findById(id: string): Promise<User | undefined> {
        const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return row;
    }

    async findByPhone(phone: string): Promise<User | undefined> {
        const [row] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
        return row;
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return row;
    }

    async findByGoogleId(googleId: string): Promise<User | undefined> {
        const [row] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
        return row;
    }

    async create(data: NewUser): Promise<User> {
        const [row] = await db.insert(users).values(data).returning();
        return row;
    }

    async markPhoneVerified(id: string): Promise<void> {
        await db
            .update(users)
            .set({ phoneVerifiedAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, id));
    }

    async linkGoogleId(id: string, googleId: string): Promise<User> {
        const [row] = await db
            .update(users)
            .set({ googleId, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to link google id");
        }
        return row;
    }

    async linkPhone(id: string, phone: string): Promise<User> {
        const [row] = await db
            .update(users)
            .set({
                phone,
                phoneVerifiedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to link phone");
        }
        return row;
    }

    async linkGoogleProfile(
        id: string,
        input: { googleId: string; email?: string | null; avatar?: string | null },
    ): Promise<User> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error("user not found");
        }
        const [row] = await db
            .update(users)
            .set({
                googleId: input.googleId,
                email: existing.email ?? input.email ?? null,
                avatar: existing.avatar ?? input.avatar ?? null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to link google profile");
        }
        return row;
    }

    async setAvatar(id: string, avatar: string): Promise<User> {
        const [row] = await db
            .update(users)
            .set({ avatar, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to set avatar");
        }
        return row;
    }

    async updateProfile(id: string, input: { name: string; email: string }): Promise<User> {
        const [row] = await db
            .update(users)
            .set({
                name: input.name.trim(),
                email: input.email.trim().toLowerCase(),
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to update user profile");
        }
        return row;
    }

    async updateName(id: string, name: string): Promise<void> {
        await db
            .update(users)
            .set({ name: name.trim(), updatedAt: new Date() })
            .where(eq(users.id, id));
    }

    async setEmail(id: string, email: string): Promise<User> {
        const [row] = await db
            .update(users)
            .set({
                email: email.trim().toLowerCase(),
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to set email");
        }
        return row;
    }

    async updateStatus(id: string, status: UserStatus): Promise<User> {
        const [row] = await db
            .update(users)
            .set({ status, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to update user status");
        }
        return row;
    }

    async updateRole(id: string, role: UserRole): Promise<User> {
        const [row] = await db
            .update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        if (!row) {
            throw new Error("failed to update user role");
        }
        return row;
    }

    async countByRole(role: UserRole): Promise<number> {
        const [{ total }] = await db
            .select({ total: count() })
            .from(users)
            .where(eq(users.role, role));
        return Number(total ?? 0);
    }

    async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
        await db
            .update(users)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(users.id, id));
    }

    async setMustChangePassword(id: string, value: boolean): Promise<void> {
        await db
            .update(users)
            .set({ mustChangePassword: value, updatedAt: new Date() })
            .where(eq(users.id, id));
    }
}
