import { and, count, eq, gte, sql } from "drizzle-orm";
import { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { db } from "@/db/postgres-client.js";
import type { OrderStatus } from "@/modules/booking/domain/order-status.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import type { PublicAdminOrderSummary } from "@/modules/booking/orders/order.service.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { financialAdminService } from "@/modules/payments/admin/financial-admin.service.js";

const STATUS_GROUPS = {
    completed: {
        key: "completed",
        label: "Completed",
        statuses: ["COMPLETED"] as const,
    },
    inProgress: {
        key: "inProgress",
        label: "In progress",
        statuses: ["ASSIGNED", "EN_ROUTE", "ON_SITE"] as const,
    },
    needsAssign: {
        key: "needsAssign",
        label: "Needs assign",
        statuses: ["CONFIRMED"] as const,
    },
    pending: {
        key: "pending",
        label: "Pending",
        statuses: ["DRAFT", "PENDING_PAYMENT"] as const,
    },
    cancelled: {
        key: "cancelled",
        label: "Cancelled",
        statuses: ["CANCELLED", "DISPUTED"] as const,
    },
} as const;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfUtcDay(date = new Date()): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date = new Date()): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

function lastSixMonthStarts(): Date[] {
    const now = new Date();
    const months: Date[] = [];
    for (let i = 5; i >= 0; i -= 1) {
        months.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)));
    }
    return months;
}

export type DashboardOverview = {
    kpis: {
        totalBookings: number;
        bookingsToday: number;
        needsAssign: number;
        activeVendors: number;
        pendingVendors: number;
        totalCustomers: number;
        platformRevenuePaise: number;
        revenueThisMonthPaise: number;
    };
    bookingsByStatus: Array<{ key: string; label: string; count: number }>;
    bookingsByMonth: Array<{ month: string; bookings: number; revenuePaise: number }>;
    recentBookings: PublicAdminOrderSummary[];
};

export class DashboardService {
    private readonly orders = new OrderRepository();
    private readonly assignments = new AssignmentRepository();

    async getOverview(): Promise<DashboardOverview> {
        const todayStart = startOfUtcDay();
        const monthStart = startOfUtcMonth();
        const sixMonthsStart = lastSixMonthStarts()[0];

        const financials = await financialAdminService.getOverview();

        const [
            totalBookingsRow,
            bookingsTodayRow,
            needsAssignRow,
            activeVendorsRow,
            pendingVendorsRow,
            totalCustomersRow,
            revenueThisMonthRow,
            statusRows,
            monthRows,
            recentResult,
        ] = await Promise.all([
            db.select({ total: count() }).from(orders),
            db
                .select({ total: count() })
                .from(orders)
                .where(gte(orders.createdAt, todayStart)),
            db
                .select({ total: count() })
                .from(orders)
                .where(eq(orders.status, "CONFIRMED")),
            db
                .select({ total: count() })
                .from(vendors)
                .where(eq(vendors.onboardingStatus, "ACTIVE")),
            db
                .select({ total: count() })
                .from(vendors)
                .where(eq(vendors.onboardingStatus, "PENDING")),
            db
                .select({ total: count() })
                .from(users)
                .where(eq(users.role, "user")),
            db
                .select({
                    total: sql<number>`coalesce(sum(${orders.subtotalPaise} - ${orders.discountPaise}), 0)::int`,
                })
                .from(orders)
                .where(
                    and(
                        eq(orders.status, "COMPLETED"),
                        gte(orders.createdAt, monthStart),
                    ),
                ),
            db
                .select({
                    status: orders.status,
                    total: count(),
                })
                .from(orders)
                .groupBy(orders.status),
            db
                .select({
                    monthStart: sql<Date>`date_trunc('month', ${orders.createdAt})`,
                    bookings: count(),
                    revenuePaise: sql<number>`coalesce(sum(case when ${orders.status} = 'COMPLETED' then ${orders.subtotalPaise} - ${orders.discountPaise} else 0 end), 0)::int`,
                })
                .from(orders)
                .where(gte(orders.createdAt, sixMonthsStart))
                .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
                .orderBy(sql`date_trunc('month', ${orders.createdAt})`),
            this.orders.listAdmin({ sort: "created_at" }, { page: 1, limit: 8 }),
        ]);

        const statusCounts = new Map<OrderStatus, number>();
        for (const row of statusRows) {
            statusCounts.set(row.status, Number(row.total ?? 0));
        }

        const bookingsByStatus = Object.values(STATUS_GROUPS).map((group) => ({
            key: group.key,
            label: group.label,
            count: group.statuses.reduce(
                (sum, status) => sum + (statusCounts.get(status) ?? 0),
                0,
            ),
        }));

        const monthMap = new Map<string, { bookings: number; revenuePaise: number }>();
        for (const row of monthRows) {
            const key = monthKey(new Date(row.monthStart));
            monthMap.set(key, {
                bookings: Number(row.bookings ?? 0),
                revenuePaise: Number(row.revenuePaise ?? 0),
            });
        }

        const bookingsByMonth = lastSixMonthStarts().map((date) => {
            const data = monthMap.get(monthKey(date)) ?? { bookings: 0, revenuePaise: 0 };
            return {
                month: MONTH_LABELS[date.getUTCMonth()],
                bookings: data.bookings,
                revenuePaise: data.revenuePaise,
            };
        });

        const assignees = await this.assignments.findAssigneesByOrderIds(
            recentResult.items.map((row) => row.id),
        );

        const recentBookings: PublicAdminOrderSummary[] = recentResult.items.map((row) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            scheduledAt: row.scheduledAt.toISOString(),
            subtotalPaise: row.subtotalPaise,
            cityName: row.cityName,
            pincode: row.pincode,
            delivery: {
                address: row.addressLine,
                landmark: row.landmark,
            },
            primaryName: row.primaryName,
            primaryImageUrl: row.primaryImageUrl,
            itemCount: row.itemCount,
            customerName: row.customerName,
            customerPhone: row.customerPhone,
            paymentMethod: row.paymentMethod,
            source: row.source,
            assigneeName: assignees.get(row.id)?.name ?? null,
            createdAt: row.createdAt.toISOString(),
            fulfillmentType: row.fulfillmentType,
            dispatchStatus: row.dispatchStatus,
            canReview: false,
            reviewSubmitted: false,
        }));

        return {
            kpis: {
                totalBookings: Number(totalBookingsRow[0]?.total ?? 0),
                bookingsToday: Number(bookingsTodayRow[0]?.total ?? 0),
                needsAssign: Number(needsAssignRow[0]?.total ?? 0),
                activeVendors: Number(activeVendorsRow[0]?.total ?? 0),
                pendingVendors: Number(pendingVendorsRow[0]?.total ?? 0),
                totalCustomers: Number(totalCustomersRow[0]?.total ?? 0),
                platformRevenuePaise: financials.platformRevenuePaise,
                revenueThisMonthPaise: Number(revenueThisMonthRow[0]?.total ?? 0),
            },
            bookingsByStatus,
            bookingsByMonth,
            recentBookings,
        };
    }
}

export const dashboardService = new DashboardService();
