import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { db } from "@/db/postgres-client.js";
import {
    vendorMembers,
    type VendorMember,
    type VendorMemberKind,
    type VendorMemberStatus,
} from "@/modules/identity/vendor-members/vendor-member.schema.js";

export interface IVendorMemberRepository {
    findById(id: string): Promise<VendorMember | undefined>;
    findByIdForVendor(vendorId: string, memberId: string): Promise<VendorMember | undefined>;
    listForVendor(vendorId: string): Promise<VendorMember[]>;
    listWorkersPaginated(
        vendorId: string,
        pagination: PaginationQuery,
        filters?: { q?: string; status?: VendorMemberStatus },
    ): Promise<{ items: VendorMember[]; total: number }>;
    workerStatusCounts(
        vendorId: string,
        q?: string,
    ): Promise<{ all: number; active: number; invited: number; disabled: number }>;
    findActiveByUserId(userId: string): Promise<VendorMember | undefined>;
    findInvitedByPhone(phone: string): Promise<VendorMember | undefined>;
    findActiveMembershipForUserOnVendor(userId: string, vendorId: string): Promise<VendorMember | undefined>;
    countActiveMembershipsForUser(userId: string): Promise<number>;
    disableAllWorkersForVendor(vendorId: string): Promise<VendorMember[]>;
    findOwnerMemberForVendor(vendorId: string): Promise<VendorMember | undefined>;
    findActiveMemberElsewhere(phone: string, excludeVendorId?: string): Promise<VendorMember | undefined>;
    create(data: {
        vendorId: string;
        invitedPhone: string;
        displayName: string;
        kind: VendorMemberKind;
        status: VendorMemberStatus;
        userId?: string | null;
    }): Promise<VendorMember>;
    update(
        id: string,
        data: Partial<{
            displayName: string;
            status: VendorMemberStatus;
            userId: string | null;
        }>,
    ): Promise<VendorMember | undefined>;
    upsertOwnerForVendor(input: {
        vendorId: string;
        userId: string;
        invitedPhone: string;
        displayName: string;
    }): Promise<VendorMember>;
}

export class VendorMemberRepository implements IVendorMemberRepository {
    async findById(id: string): Promise<VendorMember | undefined> {
        const [row] = await db.select().from(vendorMembers).where(eq(vendorMembers.id, id)).limit(1);
        return row;
    }

    async findByIdForVendor(vendorId: string, memberId: string): Promise<VendorMember | undefined> {
        const [row] = await db
            .select()
            .from(vendorMembers)
            .where(and(eq(vendorMembers.id, memberId), eq(vendorMembers.vendorId, vendorId)))
            .limit(1);
        return row;
    }

    async listForVendor(vendorId: string): Promise<VendorMember[]> {
        return db
            .select()
            .from(vendorMembers)
            .where(eq(vendorMembers.vendorId, vendorId))
            .orderBy(vendorMembers.createdAt);
    }

    private workerBaseConditions(vendorId: string, q?: string) {
        const conditions = [
            eq(vendorMembers.vendorId, vendorId),
            eq(vendorMembers.kind, "WORKER"),
        ];
        const term = q?.trim();
        if (term) {
            const pattern = `%${term}%`;
            conditions.push(
                or(
                    ilike(vendorMembers.displayName, pattern),
                    ilike(vendorMembers.invitedPhone, pattern),
                )!,
            );
        }
        return conditions;
    }

    async listWorkersPaginated(
        vendorId: string,
        pagination: PaginationQuery,
        filters?: { q?: string; status?: VendorMemberStatus },
    ): Promise<{ items: VendorMember[]; total: number }> {
        const conditions = this.workerBaseConditions(vendorId, filters?.q);
        if (filters?.status) {
            conditions.push(eq(vendorMembers.status, filters.status));
        }
        const whereClause = and(...conditions);
        const offset = paginationOffset(pagination);

        const items = await db
            .select()
            .from(vendorMembers)
            .where(whereClause)
            .orderBy(vendorMembers.createdAt)
            .limit(pagination.limit)
            .offset(offset);

        const [totalRow] = await db
            .select({ total: sql<number>`count(*)::int` })
            .from(vendorMembers)
            .where(whereClause);

        return { items, total: Number(totalRow?.total ?? 0) };
    }

    async workerStatusCounts(
        vendorId: string,
        q?: string,
    ): Promise<{ all: number; active: number; invited: number; disabled: number }> {
        const whereClause = and(...this.workerBaseConditions(vendorId, q));
        const rows = await db
            .select({
                status: vendorMembers.status,
                count: sql<number>`count(*)::int`,
            })
            .from(vendorMembers)
            .where(whereClause)
            .groupBy(vendorMembers.status);

        const counts = { all: 0, active: 0, invited: 0, disabled: 0 };
        for (const row of rows) {
            const n = Number(row.count);
            counts.all += n;
            if (row.status === "active") counts.active = n;
            if (row.status === "invited") counts.invited = n;
            if (row.status === "disabled") counts.disabled = n;
        }
        return counts;
    }

    async findActiveByUserId(userId: string): Promise<VendorMember | undefined> {
        const [row] = await db
            .select()
            .from(vendorMembers)
            .where(and(eq(vendorMembers.userId, userId), eq(vendorMembers.status, "active")))
            .limit(1);
        return row;
    }

    async findInvitedByPhone(phone: string): Promise<VendorMember | undefined> {
        const [row] = await db
            .select()
            .from(vendorMembers)
            .where(and(eq(vendorMembers.invitedPhone, phone), eq(vendorMembers.status, "invited")))
            .limit(1);
        return row;
    }

    async findActiveMembershipForUserOnVendor(
        userId: string,
        vendorId: string,
    ): Promise<VendorMember | undefined> {
        const [row] = await db
            .select()
            .from(vendorMembers)
            .where(
                and(
                    eq(vendorMembers.userId, userId),
                    eq(vendorMembers.vendorId, vendorId),
                    eq(vendorMembers.status, "active"),
                ),
            )
            .limit(1);
        return row;
    }

    async countActiveMembershipsForUser(userId: string): Promise<number> {
        const [row] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(vendorMembers)
            .where(and(eq(vendorMembers.userId, userId), eq(vendorMembers.status, "active")));
        return Number(row?.count ?? 0);
    }

    async disableAllWorkersForVendor(vendorId: string): Promise<VendorMember[]> {
        return db
            .update(vendorMembers)
            .set({ status: "disabled", updatedAt: new Date() })
            .where(
                and(
                    eq(vendorMembers.vendorId, vendorId),
                    eq(vendorMembers.kind, "WORKER"),
                    ne(vendorMembers.status, "disabled"),
                ),
            )
            .returning();
    }

    async findOwnerMemberForVendor(vendorId: string): Promise<VendorMember | undefined> {
        const [row] = await db
            .select()
            .from(vendorMembers)
            .where(and(eq(vendorMembers.vendorId, vendorId), eq(vendorMembers.kind, "OWNER")))
            .limit(1);
        return row;
    }

    async findActiveMemberElsewhere(
        phone: string,
        excludeVendorId?: string,
    ): Promise<VendorMember | undefined> {
        const conditions = [
            eq(vendorMembers.invitedPhone, phone),
            eq(vendorMembers.status, "active"),
            ne(vendorMembers.kind, "OWNER"),
        ];
        if (excludeVendorId) {
            conditions.push(ne(vendorMembers.vendorId, excludeVendorId));
        }
        const [row] = await db
            .select()
            .from(vendorMembers)
            .where(and(...conditions))
            .limit(1);
        return row;
    }

    async create(data: {
        vendorId: string;
        invitedPhone: string;
        displayName: string;
        kind: VendorMemberKind;
        status: VendorMemberStatus;
        userId?: string | null;
    }): Promise<VendorMember> {
        const [row] = await db
            .insert(vendorMembers)
            .values({
                vendorId: data.vendorId,
                invitedPhone: data.invitedPhone,
                displayName: data.displayName,
                kind: data.kind,
                status: data.status,
                userId: data.userId ?? null,
                updatedAt: new Date(),
            })
            .returning();
        return row;
    }

    async update(
        id: string,
        data: Partial<{
            displayName: string;
            status: VendorMemberStatus;
            userId: string | null;
        }>,
    ): Promise<VendorMember | undefined> {
        const [row] = await db
            .update(vendorMembers)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(vendorMembers.id, id))
            .returning();
        return row;
    }

    async upsertOwnerForVendor(input: {
        vendorId: string;
        userId: string;
        invitedPhone: string;
        displayName: string;
    }): Promise<VendorMember> {
        const existing = await this.findOwnerMemberForVendor(input.vendorId);
        if (existing) {
            const updated = await this.update(existing.id, {
                userId: input.userId,
                displayName: input.displayName,
                status: "active",
            });
            return updated ?? existing;
        }
        return this.create({
            vendorId: input.vendorId,
            userId: input.userId,
            invitedPhone: input.invitedPhone,
            displayName: input.displayName,
            kind: "OWNER",
            status: "active",
        });
    }
}
