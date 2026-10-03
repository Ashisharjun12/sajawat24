import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { sessions, type Session } from "@/modules/identity/sessions/session.schema.js";

export type NewSession = {
    userId: string;
    familyId: string;
    tokenHash: string;
    device: string;
    expiresAt: Date;
};

export interface ISessionRepository {
    insert(data: NewSession): Promise<Session>;
    findByHash(tokenHash: string): Promise<Session | undefined>;
    revokeActiveByHash(tokenHash: string): Promise<Session | undefined>;
    revokeAllForFamily(familyId: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
    revokeById(id: string): Promise<void>;
}

export class SessionRepository implements ISessionRepository {
    async insert(data: NewSession): Promise<Session> {
        const [row] = await db.insert(sessions).values(data).returning();
        return row;
    }

    async findByHash(tokenHash: string): Promise<Session | undefined> {
        const [row] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
        return row;
    }

    async revokeActiveByHash(tokenHash: string): Promise<Session | undefined> {
        const [row] = await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(
                and(
                    eq(sessions.tokenHash, tokenHash),
                    isNull(sessions.revokedAt),
                    gt(sessions.expiresAt, new Date()),
                ),
            )
            .returning();
        return row;
    }

    async revokeAllForFamily(familyId: string): Promise<void> {
        await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(and(eq(sessions.familyId, familyId), isNull(sessions.revokedAt)));
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
    }

    async revokeById(id: string): Promise<void> {
        await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
    }
}
