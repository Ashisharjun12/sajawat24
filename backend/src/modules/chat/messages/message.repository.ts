import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    messages,
    type Message,
    type MessageSenderRole,
} from "@/modules/chat/conversations/conversation.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type InsertMessageInput = {
    conversationId: string;
    senderUserId: string | null;
    senderRole: MessageSenderRole;
    body: string | null;
    messageType?: Message["messageType"];
    attachmentUrl?: string | null;
    clientMessageId?: string | null;
};

export interface IMessageRepository {
    findByClientMessageId(
        conversationId: string,
        clientMessageId: string,
    ): Promise<Message | undefined>;
    findById(id: string): Promise<Message | undefined>;
    nextSequence(conversationId: string, tx: DbTx): Promise<number>;
    insert(input: InsertMessageInput, sequence: number, tx: DbTx): Promise<Message>;
    list(
        conversationId: string,
        opts: {
            afterSequence?: number;
            beforeSequence?: number;
            limit: number;
        },
    ): Promise<Message[]>;
}

export class MessageRepository implements IMessageRepository {
    async findByClientMessageId(
        conversationId: string,
        clientMessageId: string,
    ): Promise<Message | undefined> {
        const [row] = await db
            .select()
            .from(messages)
            .where(
                and(
                    eq(messages.conversationId, conversationId),
                    eq(messages.clientMessageId, clientMessageId),
                ),
            )
            .limit(1);
        return row;
    }

    async findById(id: string): Promise<Message | undefined> {
        const [row] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
        return row;
    }

    async nextSequence(conversationId: string, tx: DbTx): Promise<number> {
        const [row] = await tx
            .select({ max: sql<number>`coalesce(max(${messages.sequence}), 0)::int` })
            .from(messages)
            .where(eq(messages.conversationId, conversationId));
        return (row?.max ?? 0) + 1;
    }

    async insert(input: InsertMessageInput, sequence: number, tx: DbTx): Promise<Message> {
        const [row] = await tx
            .insert(messages)
            .values({
                conversationId: input.conversationId,
                sequence,
                senderUserId: input.senderUserId,
                senderRole: input.senderRole,
                body: input.body,
                messageType: input.messageType ?? "text",
                attachmentUrl: input.attachmentUrl ?? null,
                clientMessageId: input.clientMessageId ?? null,
            })
            .returning();
        return row;
    }

    async list(
        conversationId: string,
        opts: { afterSequence?: number; beforeSequence?: number; limit: number },
    ): Promise<Message[]> {
        const conditions = [eq(messages.conversationId, conversationId)];
        if (opts.afterSequence != null) {
            conditions.push(gt(messages.sequence, opts.afterSequence));
        }
        if (opts.beforeSequence != null) {
            conditions.push(lt(messages.sequence, opts.beforeSequence));
        }

        const order = opts.afterSequence != null
            ? messages.sequence
            : desc(messages.sequence);

        const rows = await db
            .select()
            .from(messages)
            .where(and(...conditions))
            .orderBy(order)
            .limit(opts.limit);

        if (opts.beforeSequence != null || opts.afterSequence == null) {
            return rows.reverse();
        }
        return rows;
    }
}
