import {
    and,
    count,
    desc,
    eq,
    exists,
    gte,
    ilike,
    lte,
    or,
    sql,
} from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { orderPayablePaise } from "@/modules/booking/orders/order-totals.js";
import type {
    AdminCustomerDetail,
    AdminCustomerListItem,
    AdminCustomerOrderSummary,
} from "@/modules/identity/customers/customer.public.js";
import { users, type UserStatus } from "@/modules/identity/users/user.schema.js";

export type CustomerListInput = {
    page: number;
    limit: number;
    status?: UserStatus;
    search?: string;
    cityId?: string;
    hasBookings?: boolean;
    joinedFrom?: Date;
    joinedTo?: Date;
};

export interface ICustomerRepository {
    listAdmin(input: CustomerListInput): Promise<{ items: AdminCustomerListItem[]; total: number }>;
    findAdminDetail(id: string): Promise<AdminCustomerDetail | undefined>;
    updateStatus(id: string, status: UserStatus): Promise<AdminCustomerListItem | undefined>;
}

function bookingCountExpr() {
    return sql<number>`coalesce((
        select count(*)::int
        from ${orders}
        where ${orders.userId} = ${users.id}
    ), 0)`;
}

export class CustomerRepository implements ICustomerRepository {
    private buildListFilters(input: CustomerListInput) {
        const filters = [eq(users.role, "user")];

        if (input.status) {
            filters.push(eq(users.status, input.status));
        }

        if (input.search) {
            const pattern = `%${input.search}%`;
            filters.push(
                or(
                    ilike(users.name, pattern),
                    ilike(users.phone, pattern),
                    ilike(users.email, pattern),
                )!,
            );
        }

        if (input.cityId) {
            filters.push(
                exists(
                    db
                        .select({ one: sql`1` })
                        .from(orders)
                        .where(and(eq(orders.userId, users.id), eq(orders.cityId, input.cityId!))),
                ),
            );
        }

        if (input.hasBookings === true) {
            filters.push(sql`${bookingCountExpr()} > 0`);
        } else if (input.hasBookings === false) {
            filters.push(sql`${bookingCountExpr()} = 0`);
        }

        if (input.joinedFrom) {
            filters.push(gte(users.createdAt, input.joinedFrom));
        }

        if (input.joinedTo) {
            filters.push(lte(users.createdAt, input.joinedTo));
        }

        return filters.length ? and(...filters) : undefined;
    }

    async listAdmin(input: CustomerListInput): Promise<{ items: AdminCustomerListItem[]; total: number }> {
        const offset = (input.page - 1) * input.limit;
        const whereClause = this.buildListFilters(input);

        const [totalRow] = await db.select({ total: count() }).from(users).where(whereClause);

        const rows = await db
            .select({
                id: users.id,
                name: users.name,
                phone: users.phone,
                email: users.email,
                status: users.status,
                createdAt: users.createdAt,
                bookingCount: bookingCountExpr(),
            })
            .from(users)
            .where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(input.limit)
            .offset(offset);

        return {
            items: rows.map((row) => ({
                ...row,
                bookingCount: Number(row.bookingCount ?? 0),
            })),
            total: Number(totalRow?.total ?? 0),
        };
    }

    async findAdminDetail(id: string): Promise<AdminCustomerDetail | undefined> {
        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                phone: users.phone,
                email: users.email,
                status: users.status,
                avatar: users.avatar,
                createdAt: users.createdAt,
                bookingCount: bookingCountExpr(),
            })
            .from(users)
            .where(and(eq(users.id, id), eq(users.role, "user")))
            .limit(1);

        if (!user) return undefined;

        const [stats] = await db
            .select({
                completedCount: sql<number>`count(*) filter (where ${orders.status} = 'COMPLETED')::int`,
                cancelledCount: sql<number>`count(*) filter (where ${orders.status} = 'CANCELLED')::int`,
                lastBookingAt: sql<Date | null>`max(${orders.createdAt})`,
            })
            .from(orders)
            .where(eq(orders.userId, id));

        const orderRows = await db
            .select({
                id: orders.id,
                reference: orders.reference,
                status: orders.status,
                cityName: orders.cityName,
                scheduledAt: orders.scheduledAt,
                subtotalPaise: orders.subtotalPaise,
                discountPaise: orders.discountPaise,
            })
            .from(orders)
            .where(eq(orders.userId, id))
            .orderBy(desc(orders.createdAt))
            .limit(10);

        const completedOrders = await db
            .select({
                subtotalPaise: orders.subtotalPaise,
                discountPaise: orders.discountPaise,
            })
            .from(orders)
            .where(and(eq(orders.userId, id), eq(orders.status, "COMPLETED")));

        const totalSpendPaise = completedOrders.reduce(
            (sum, order) => sum + orderPayablePaise(order),
            0,
        );

        const recentOrders: AdminCustomerOrderSummary[] = orderRows.map((row) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            cityName: row.cityName,
            scheduledAt: row.scheduledAt,
            totalPaise: orderPayablePaise(row),
        }));

        return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            status: user.status,
            avatar: user.avatar,
            createdAt: user.createdAt,
            bookingCount: Number(user.bookingCount ?? 0),
            completedCount: Number(stats?.completedCount ?? 0),
            cancelledCount: Number(stats?.cancelledCount ?? 0),
            totalSpendPaise,
            lastBookingAt: stats?.lastBookingAt ?? null,
            recentOrders,
        };
    }

    async updateStatus(id: string, status: UserStatus): Promise<AdminCustomerListItem | undefined> {
        const [row] = await db
            .update(users)
            .set({ status, updatedAt: new Date() })
            .where(and(eq(users.id, id), eq(users.role, "user")))
            .returning({
                id: users.id,
                name: users.name,
                phone: users.phone,
                email: users.email,
                status: users.status,
                createdAt: users.createdAt,
            });

        if (!row) return undefined;

        const [countRow] = await db
            .select({ bookingCount: count() })
            .from(orders)
            .where(eq(orders.userId, id));

        return {
            ...row,
            bookingCount: Number(countRow?.bookingCount ?? 0),
        };
    }
}
