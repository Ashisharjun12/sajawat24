import { and, desc, eq, gte, ilike, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { assignments } from "@/modules/assignment/assignments/assignment.schema.js";
import {
    orderItemAddons,
    orderItems,
    orders,
} from "@/modules/booking/orders/order.schema.js";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { displayUrl } from "@/modules/upload/media/media.public.js";
import { uploads } from "@/modules/upload/media/media.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type VendorJobRow = {
    orderId: string;
    reference: string;
    status: string;
    scheduledAt: Date;
    paymentMethod: string;
    subtotalPaise: number;
    customerName: string;
    customerPhone: string;
    addressLine: string;
    landmark: string | null;
    cityName: string;
    pincode: string;
    vendorResponse: "pending" | "accepted" | "declined";
    primaryName: string;
    primaryImageUrl: string | null;
    itemCount: number;
};

export interface IVendorJobRepository {
    listForVendor(
        vendorId: string,
        filter: "today" | "upcoming" | "completed" | "action" | undefined,
        pagination: PaginationQuery,
        orderIds?: string[],
        search?: string,
    ): Promise<{ items: VendorJobRow[]; total: number }>;
    findJobForVendor(vendorId: string, orderId: string): Promise<VendorJobRow | undefined>;
    loadOrderItems(orderId: string): Promise<
        Array<{
            id: string;
            productId: string;
            name: string;
            imageUrl: string | null;
            quantity: number;
            productPaise: number;
            addonsPaise: number;
            lineTotalPaise: number;
            addons: Array<{
                id: string;
                name: string;
                quantity: number;
                pricePaise: number;
                imageUrl: string | null;
            }>;
        }>
    >;
}

function startOfTodayIst(): Date {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    ist.setUTCHours(0, 0, 0, 0);
    return new Date(ist.getTime() - istOffset);
}

function endOfTodayIst(): Date {
    const start = startOfTodayIst();
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export class VendorJobRepository implements IVendorJobRepository {
    async listForVendor(
        vendorId: string,
        filter: "today" | "upcoming" | "completed" | "action" | undefined,
        pagination: PaginationQuery,
        orderIds?: string[],
        search?: string,
    ): Promise<{ items: VendorJobRow[]; total: number }> {
        if (orderIds && orderIds.length === 0) {
            return { items: [], total: 0 };
        }

        const conditions = [
            eq(assignments.vendorId, vendorId),
            inArray(assignments.vendorResponse, ["pending", "accepted"]),
            isNull(assignments.supersededAt),
            ne(orders.status, "CANCELLED"),
        ];

        const todayStart = startOfTodayIst();
        const todayEnd = endOfTodayIst();

        if (orderIds) {
            conditions.push(inArray(orders.id, orderIds));
        }

        if (filter === "action") {
            conditions.push(eq(assignments.vendorResponse, "pending"));
        } else if (filter === "completed") {
            conditions.push(eq(orders.status, "COMPLETED"));
        } else if (filter === "today") {
            conditions.push(gte(orders.scheduledAt, todayStart));
            conditions.push(lt(orders.scheduledAt, todayEnd));
            conditions.push(ne(orders.status, "COMPLETED"));
        } else if (filter === "upcoming") {
            conditions.push(gte(orders.scheduledAt, todayEnd));
            conditions.push(ne(orders.status, "COMPLETED"));
        }

        const term = search?.trim();
        if (term) {
            const pattern = `%${term}%`;
            conditions.push(
                or(
                    ilike(orders.customerName, pattern),
                    ilike(orders.customerPhone, pattern),
                    ilike(orders.reference, pattern),
                    ilike(orders.addressLine, pattern),
                    ilike(orders.cityName, pattern),
                )!,
            );
        }

        const whereClause = and(...conditions);
        const offset = paginationOffset(pagination);

        const rows = await db
            .select({
                orderId: orders.id,
                reference: orders.reference,
                status: orders.status,
                scheduledAt: orders.scheduledAt,
                paymentMethod: orders.paymentMethod,
                subtotalPaise: orders.subtotalPaise,
                customerName: orders.customerName,
                customerPhone: orders.customerPhone,
                addressLine: orders.addressLine,
                landmark: orders.landmark,
                cityName: orders.cityName,
                pincode: orders.pincode,
                vendorResponse: assignments.vendorResponse,
                primaryName: sql<string>`(
                    SELECT oi.product_name FROM order_items oi
                    WHERE oi.order_id = ${orders.id}
                    ORDER BY oi.created_at ASC
                    LIMIT 1
                )`,
                primaryImageUrl: sql<string | null>`(
                    SELECT oi.image_url FROM order_items oi
                    WHERE oi.order_id = ${orders.id}
                    ORDER BY oi.created_at ASC
                    LIMIT 1
                )`,
                itemCount: sql<number>`(
                    SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = ${orders.id}
                )`,
            })
            .from(assignments)
            .innerJoin(orders, eq(assignments.orderId, orders.id))
            .where(whereClause)
            .orderBy(desc(orders.scheduledAt))
            .limit(pagination.limit)
            .offset(offset);

        const [totalRow] = await db
            .select({ total: sql<number>`count(*)::int` })
            .from(assignments)
            .innerJoin(orders, eq(assignments.orderId, orders.id))
            .where(whereClause);

        return { items: rows, total: Number(totalRow?.total ?? 0) };
    }

    async findJobForVendor(vendorId: string, orderId: string): Promise<VendorJobRow | undefined> {
        const [row] = await db
            .select({
                orderId: orders.id,
                reference: orders.reference,
                status: orders.status,
                scheduledAt: orders.scheduledAt,
                paymentMethod: orders.paymentMethod,
                subtotalPaise: orders.subtotalPaise,
                customerName: orders.customerName,
                customerPhone: orders.customerPhone,
                addressLine: orders.addressLine,
                landmark: orders.landmark,
                cityName: orders.cityName,
                pincode: orders.pincode,
                vendorResponse: assignments.vendorResponse,
                primaryName: sql<string>`(
                    SELECT oi.product_name FROM order_items oi
                    WHERE oi.order_id = ${orders.id}
                    ORDER BY oi.created_at ASC
                    LIMIT 1
                )`,
                primaryImageUrl: sql<string | null>`(
                    SELECT oi.image_url FROM order_items oi
                    WHERE oi.order_id = ${orders.id}
                    ORDER BY oi.created_at ASC
                    LIMIT 1
                )`,
                itemCount: sql<number>`(
                    SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = ${orders.id}
                )`,
            })
            .from(assignments)
            .innerJoin(orders, eq(assignments.orderId, orders.id))
            .where(
                and(
                    eq(assignments.vendorId, vendorId),
                    eq(assignments.orderId, orderId),
                    inArray(assignments.vendorResponse, ["pending", "accepted"]),
                    isNull(assignments.supersededAt),
                ),
            )
            .limit(1);
        return row;
    }

    async loadOrderItems(orderId: string) {
        const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId))
            .orderBy(orderItems.createdAt);

        const itemIds = items.map((item) => item.id);
        const addonRows = itemIds.length
            ? await db
                  .select()
                  .from(orderItemAddons)
                  .where(inArray(orderItemAddons.orderItemId, itemIds))
            : [];

        const addonsByItem = new Map<string, typeof addonRows>();
        for (const addon of addonRows) {
            const list = addonsByItem.get(addon.orderItemId) ?? [];
            list.push(addon);
            addonsByItem.set(addon.orderItemId, list);
        }

        const addonCatalogIds = [...new Set(addonRows.map((row) => row.addonId))];
        const addonImageByCatalogId = new Map<string, string | null>();
        if (addonCatalogIds.length > 0) {
            const catalogRows = await db
                .select({
                    addonId: addons.id,
                    upload: uploads,
                })
                .from(addons)
                .leftJoin(uploads, eq(addons.imageUploadId, uploads.id))
                .where(inArray(addons.id, addonCatalogIds));

            for (const row of catalogRows) {
                addonImageByCatalogId.set(
                    row.addonId,
                    row.upload ? displayUrl(row.upload) : null,
                );
            }
        }

        return items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.productName,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            productPaise: item.productPaise,
            addonsPaise: item.addonsPaise,
            lineTotalPaise: item.lineTotalPaise,
            addons: (addonsByItem.get(item.id) ?? []).map((addon) => ({
                id: addon.id,
                name: addon.addonName,
                quantity: addon.quantity,
                pricePaise: addon.pricePaise,
                imageUrl: addonImageByCatalogId.get(addon.addonId) ?? null,
            })),
        }));
    }
}
