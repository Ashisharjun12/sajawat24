import {
    and,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    isNull,
    lte,
    or,
    sql,
} from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    conversationParticipants,
    conversations,
    type Conversation,
    type ConversationStatus,
    type ConversationType,
    type NewConversation,
} from "@/modules/chat/conversations/conversation.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type InboxListParams = {
    userId: string;
    type?: ConversationType;
    status?: ConversationStatus | "all";
    unread?: boolean;
    q?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
};

export type ConversationListRow = Conversation & {
    unreadCount: number;
    participantNames: string[];
};

export interface IConversationRepository {
    findById(id: string): Promise<Conversation | undefined>;
    findByTypeAndContext(
        type: ConversationType,
        contextType: Conversation["contextType"],
        contextId: string,
    ): Promise<Conversation | undefined>;
    findBySupportTopic(
        userId: string,
        topicKey: string,
        subject?: string,
    ): Promise<Conversation | undefined>;
    closeSystem(
        id: string,
        resolutionNote?: string | null,
        tx?: DbTx,
    ): Promise<Conversation | undefined>;
    create(input: NewConversation, tx?: DbTx): Promise<Conversation>;
    updateAfterMessage(
        conversationId: string,
        preview: string,
        at: Date,
        tx?: DbTx,
    ): Promise<void>;
    close(
        id: string,
        closedBy: string,
        resolutionNote?: string | null,
        tx?: DbTx,
    ): Promise<Conversation | undefined>;
    reopen(id: string, tx?: DbTx): Promise<Conversation | undefined>;
    listForParticipant(params: InboxListParams): Promise<{ items: ConversationListRow[]; total: number }>;
    listForAdmin(
        params: Omit<InboxListParams, "userId"> & {
            adminUserId?: string;
            assigned?: "mine" | "unassigned" | "all";
        },
    ): Promise<{
        items: ConversationListRow[];
        total: number;
    }>;
    assignAdmin(conversationId: string, adminUserId: string | null, tx?: DbTx): Promise<Conversation | undefined>;
}

export class ConversationRepository implements IConversationRepository {
    async findById(id: string): Promise<Conversation | undefined> {
        const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
        return row;
    }

    async findByTypeAndContext(
        type: ConversationType,
        contextType: Conversation["contextType"],
        contextId: string,
    ): Promise<Conversation | undefined> {
        const [row] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.type, type),
                    contextType ? eq(conversations.contextType, contextType) : sql`true`,
                    eq(conversations.contextId, contextId),
                ),
            )
            .limit(1);
        return row;
    }

    async findBySupportTopic(
        userId: string,
        topicKey: string,
        subject?: string,
    ): Promise<Conversation | undefined> {
        const topicMatch =
            topicKey === "general"
                ? or(eq(conversations.topicKey, topicKey), isNull(conversations.topicKey))
                : eq(conversations.topicKey, topicKey);

        const [row] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.type, "customer_support"),
                    eq(conversations.contextType, "none"),
                    eq(conversations.contextId, userId),
                    topicMatch,
                ),
            )
            .orderBy(desc(conversations.lastMessageAt))
            .limit(1);
        if (row) return row;

        const trimmedSubject = subject?.trim();
        if (!trimmedSubject || topicKey === "general") return undefined;

        const [legacy] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.type, "customer_support"),
                    eq(conversations.contextType, "none"),
                    eq(conversations.contextId, userId),
                    isNull(conversations.topicKey),
                    or(
                        eq(conversations.subject, trimmedSubject),
                        ilike(conversations.subject, `%${trimmedSubject}%`),
                    ),
                ),
            )
            .orderBy(desc(conversations.lastMessageAt))
            .limit(1);
        return legacy;
    }

    async closeSystem(
        id: string,
        resolutionNote?: string | null,
        tx?: DbTx,
    ): Promise<Conversation | undefined> {
        const client = tx ?? db;
        const now = new Date();
        const [row] = await client
            .update(conversations)
            .set({
                status: "closed",
                closedAt: now,
                closedBy: null,
                resolutionNote: resolutionNote ?? null,
                updatedAt: now,
            })
            .where(eq(conversations.id, id))
            .returning();
        return row;
    }

    async create(input: NewConversation, tx?: DbTx): Promise<Conversation> {
        const client = tx ?? db;
        const [row] = await client.insert(conversations).values(input).returning();
        return row;
    }

    async updateAfterMessage(
        conversationId: string,
        preview: string,
        at: Date,
        tx?: DbTx,
    ): Promise<void> {
        const client = tx ?? db;
        await client
            .update(conversations)
            .set({
                lastMessageAt: at,
                lastMessagePreview: preview,
                messageCount: sql`${conversations.messageCount} + 1`,
                updatedAt: at,
            })
            .where(eq(conversations.id, conversationId));
    }

    async close(
        id: string,
        closedBy: string,
        resolutionNote?: string | null,
        tx?: DbTx,
    ): Promise<Conversation | undefined> {
        const client = tx ?? db;
        const now = new Date();
        const [row] = await client
            .update(conversations)
            .set({
                status: "closed",
                closedAt: now,
                closedBy,
                resolutionNote: resolutionNote ?? null,
                updatedAt: now,
            })
            .where(eq(conversations.id, id))
            .returning();
        return row;
    }

    async reopen(id: string, tx?: DbTx): Promise<Conversation | undefined> {
        const client = tx ?? db;
        const now = new Date();
        const [row] = await client
            .update(conversations)
            .set({
                status: "open",
                closedAt: null,
                closedBy: null,
                resolutionNote: null,
                updatedAt: now,
            })
            .where(eq(conversations.id, id))
            .returning();
        return row;
    }

    async listForParticipant(params: InboxListParams): Promise<{
        items: ConversationListRow[];
        total: number;
    }> {
        const conditions = [eq(conversationParticipants.userId, params.userId)];
        if (params.type) conditions.push(eq(conversations.type, params.type));
        if (params.status && params.status !== "all") {
            conditions.push(eq(conversations.status, params.status));
        }
        if (params.unread) conditions.push(sql`${conversationParticipants.unreadCount} > 0`);
        if (params.from) conditions.push(gte(conversations.lastMessageAt, params.from));
        if (params.to) conditions.push(lte(conversations.lastMessageAt, params.to));
        if (params.q?.trim()) {
            const term = `%${params.q.trim()}%`;
            conditions.push(
                or(
                    ilike(conversations.subject, term),
                    ilike(conversations.lastMessagePreview, term),
                )!,
            );
        }

        const where = and(...conditions);
        const offset = (params.page - 1) * params.limit;

        const [countRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(conversations)
            .innerJoin(
                conversationParticipants,
                eq(conversationParticipants.conversationId, conversations.id),
            )
            .where(where);

        const rows = await db
            .select({
                conversation: conversations,
                unreadCount: conversationParticipants.unreadCount,
            })
            .from(conversations)
            .innerJoin(
                conversationParticipants,
                eq(conversationParticipants.conversationId, conversations.id),
            )
            .where(where)
            .orderBy(desc(conversations.lastMessageAt))
            .limit(params.limit)
            .offset(offset);

        const items: ConversationListRow[] = await Promise.all(
            rows.map(async (row) => ({
                ...row.conversation,
                unreadCount: row.unreadCount,
                participantNames: await this.participantNames(row.conversation.id),
            })),
        );

        return { items, total: countRow?.count ?? 0 };
    }

    async assignAdmin(
        conversationId: string,
        adminUserId: string | null,
        tx?: DbTx,
    ): Promise<Conversation | undefined> {
        const client = tx ?? db;
        const now = new Date();
        const [row] = await client
            .update(conversations)
            .set({ assignedAdminId: adminUserId, updatedAt: now })
            .where(eq(conversations.id, conversationId))
            .returning();
        return row;
    }

    async listForAdmin(
        params: Omit<InboxListParams, "userId"> & {
            adminUserId?: string;
            assigned?: "mine" | "unassigned" | "all";
        },
    ): Promise<{ items: ConversationListRow[]; total: number }> {
        const conditions: ReturnType<typeof eq>[] = [];
        if (params.type) {
            conditions.push(eq(conversations.type, params.type));
        } else {
            conditions.push(
                inArray(conversations.type, ["vendor_support", "customer_support", "complaint"]),
            );
        }
        if (params.status && params.status !== "all") {
            conditions.push(eq(conversations.status, params.status));
        }
        if (params.assigned === "mine" && params.adminUserId) {
            conditions.push(eq(conversations.assignedAdminId, params.adminUserId));
        } else if (params.assigned === "unassigned") {
            conditions.push(isNull(conversations.assignedAdminId));
        }
        if (params.from) conditions.push(gte(conversations.lastMessageAt, params.from));
        if (params.to) conditions.push(lte(conversations.lastMessageAt, params.to));
        if (params.q?.trim()) {
            const term = `%${params.q.trim()}%`;
            conditions.push(
                or(
                    ilike(conversations.subject, term),
                    ilike(conversations.lastMessagePreview, term),
                )!,
            );
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (params.page - 1) * params.limit;

        const countBase = db.select({ count: sql<number>`count(*)::int` }).from(conversations);
        const [countRow] = await (where ? countBase.where(where) : countBase);

        const listBase = db.select().from(conversations);
        const rows = await (where ? listBase.where(where) : listBase)
            .orderBy(desc(conversations.lastMessageAt))
            .limit(params.limit)
            .offset(offset);

        const items: ConversationListRow[] = await Promise.all(
            rows.map(async (conversation) => {
                const [p] = await db
                    .select({ unread: conversationParticipants.unreadCount })
                    .from(conversationParticipants)
                    .where(
                        and(
                            eq(conversationParticipants.conversationId, conversation.id),
                            params.adminUserId
                                ? eq(conversationParticipants.userId, params.adminUserId)
                                : sql`true`,
                        ),
                    )
                    .limit(1);
                return {
                    ...conversation,
                    unreadCount: p?.unread ?? 0,
                    participantNames: await this.participantNames(conversation.id),
                };
            }),
        );

        return { items, total: countRow?.count ?? 0 };
    }

    private async participantNames(conversationId: string): Promise<string[]> {
        const rows = await db
            .select({ name: users.name })
            .from(conversationParticipants)
            .innerJoin(users, eq(users.id, conversationParticipants.userId))
            .where(eq(conversationParticipants.conversationId, conversationId));
        return rows.map((r) => r.name).filter(Boolean);
    }
}
