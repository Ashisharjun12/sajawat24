import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    conversationParticipants,
    type ConversationParticipant,
    type ParticipantRole,
} from "@/modules/chat/conversations/conversation.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface IParticipantRepository {
    findByConversationAndUser(
        conversationId: string,
        userId: string,
    ): Promise<ConversationParticipant | undefined>;
    listByConversation(conversationId: string): Promise<ConversationParticipant[]>;
    upsertParticipant(
        input: {
            conversationId: string;
            userId: string;
            role: ParticipantRole;
        },
        tx?: DbTx,
    ): Promise<ConversationParticipant>;
    incrementUnreadForOthers(
        conversationId: string,
        exceptUserId: string,
        tx?: DbTx,
    ): Promise<void>;
    markRead(
        conversationId: string,
        userId: string,
        messageId: string,
        at: Date,
        tx?: DbTx,
    ): Promise<void>;
    totalUnreadForUser(userId: string): Promise<number>;
    removeParticipant(conversationId: string, userId: string, tx?: DbTx): Promise<void>;
}

export class ParticipantRepository implements IParticipantRepository {
    async findByConversationAndUser(
        conversationId: string,
        userId: string,
    ): Promise<ConversationParticipant | undefined> {
        const [row] = await db
            .select()
            .from(conversationParticipants)
            .where(
                and(
                    eq(conversationParticipants.conversationId, conversationId),
                    eq(conversationParticipants.userId, userId),
                ),
            )
            .limit(1);
        return row;
    }

    async listByConversation(conversationId: string): Promise<ConversationParticipant[]> {
        return db
            .select()
            .from(conversationParticipants)
            .where(eq(conversationParticipants.conversationId, conversationId));
    }

    async upsertParticipant(
        input: {
            conversationId: string;
            userId: string;
            role: ParticipantRole;
        },
        tx?: DbTx,
    ): Promise<ConversationParticipant> {
        const client = tx ?? db;
        const existing = await this.findByConversationAndUser(input.conversationId, input.userId);
        if (existing) return existing;

        const [row] = await client
            .insert(conversationParticipants)
            .values({
                conversationId: input.conversationId,
                userId: input.userId,
                role: input.role,
            })
            .returning();
        return row;
    }

    async incrementUnreadForOthers(
        conversationId: string,
        exceptUserId: string,
        tx?: DbTx,
    ): Promise<void> {
        const client = tx ?? db;
        await client
            .update(conversationParticipants)
            .set({ unreadCount: sql`${conversationParticipants.unreadCount} + 1` })
            .where(
                and(
                    eq(conversationParticipants.conversationId, conversationId),
                    sql`${conversationParticipants.userId} != ${exceptUserId}`,
                ),
            );
    }

    async markRead(
        conversationId: string,
        userId: string,
        messageId: string,
        at: Date,
        tx?: DbTx,
    ): Promise<void> {
        const client = tx ?? db;
        await client
            .update(conversationParticipants)
            .set({
                lastReadAt: at,
                lastReadMessageId: messageId,
                unreadCount: 0,
            })
            .where(
                and(
                    eq(conversationParticipants.conversationId, conversationId),
                    eq(conversationParticipants.userId, userId),
                ),
            );
    }

    async totalUnreadForUser(userId: string): Promise<number> {
        const [row] = await db
            .select({ total: sql<number>`coalesce(sum(${conversationParticipants.unreadCount}), 0)::int` })
            .from(conversationParticipants)
            .where(eq(conversationParticipants.userId, userId));
        return row?.total ?? 0;
    }

    async removeParticipant(conversationId: string, userId: string, tx?: DbTx): Promise<void> {
        const client = tx ?? db;
        await client
            .delete(conversationParticipants)
            .where(
                and(
                    eq(conversationParticipants.conversationId, conversationId),
                    eq(conversationParticipants.userId, userId),
                ),
            );
    }
}
