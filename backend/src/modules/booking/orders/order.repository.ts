import {
    and,
    asc,
    count,
    desc,
    eq,
    exists,
    ilike,
    inArray,
    lt,
    notInArray,
    or,
    sql,
    type SQL,
} from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { assignments } from "@/modules/assignment/assignments/assignment.schema.js";
import { cartItemAddons, cartItems, carts } from "@/modules/booking/carts/cart.schema.js";
import {
    orderItemAddons,
    orderItems,
    orders,
    type NewOrder,
    type NewOrderItem,
    type NewOrderItemAddon,
    type Order,
    type OrderItem,
    type OrderItemAddon,
} from "@/modules/booking/orders/order.schema.js";
import { couponRedemptions } from "@/modules/promotions/redemptions/redemption.schema.js";

export type OrderItemWithAddons = OrderItem & { addons: OrderItemAddon[] };
export type OrderWithItems = Order & { items: OrderItemWithAddons[] };

export type OrderItemInsert = Omit<NewOrderItem, "orderId" | "id" | "createdAt"> & {
    addons: Omit<NewOrderItemAddon, "orderItemId" | "id" | "createdAt">[];
};

export type OrderListRow = Order & {
    primaryName: string;
    primaryImageUrl: string | null;
    itemCount: number;
};

export type AdminOrderListFilter = {
    q?: string;
    statuses?: Order["status"][];
    cityId?: string;
    paymentMethod?: Order["paymentMethod"];
    sort?: "scheduled_at" | "created_at";
    userId?: string;
    vendorId?: string;
    fulfillmentType?: Order["fulfillmentType"];
    dispatchStatus?: Order["dispatchStatus"];
};

export type OrderInsertPayload = Omit<
    NewOrder,
    "id" | "createdAt" | "updatedAt" | "reference"
> & {
    reference: string;
    items: OrderItemInsert[];
};

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type UserOrderListBucket = "all" | "upcoming" | "completed" | "cancelled";

export interface IOrderRepository {
    findById(id: string): Promise<Order | undefined>;
    findByIdForUser(id: string, userId: string): Promise<Order | undefined>;
    findByIdempotency(userId: string, idempotencyKey: string): Promise<Order | undefined>;
    loadWithItems(orderId: string): Promise<OrderWithItems | undefined>;
    listForUser(
        userId: string,
        pagination: PaginationQuery,
        bucket?: UserOrderListBucket,
    ): Promise<{ items: OrderListRow[]; total: number }>;
    listAdmin(
        filter: AdminOrderListFilter,
        pagination: PaginationQuery,
    ): Promise<{ items: OrderListRow[]; total: number }>;
    insertOrderWithItems(payload: OrderInsertPayload): Promise<OrderWithItems>;
    createWithItems(
        payload: OrderInsertPayload,
        cartId: string,
        options?: { clearCart?: boolean },
    ): Promise<OrderWithItems>;
    createWithItemsAndRedemption(
        payload: OrderInsertPayload,
        cartId: string,
        redemption: { couponId: string; userId: string; code: string; discountPaise: number } | null,
        options?: { clearCart?: boolean },
    ): Promise<OrderWithItems>;
    confirmOrder(orderId: string, userId: string): Promise<Order | undefined>;
    markAssigned(orderId: string, tx?: DbTx): Promise<Order | undefined>;
    markEnRoute(orderId: string, tx?: DbTx): Promise<Order | undefined>;
    markOnSite(orderId: string, tx?: DbTx): Promise<Order | undefined>;
    markConfirmed(orderId: string, tx?: DbTx): Promise<Order | undefined>;
    markCompleted(orderId: string, tx?: DbTx): Promise<Order | undefined>;
    markCancelled(orderId: string, tx?: DbTx): Promise<Order | undefined>;
    cancelPendingPaymentForUser(
        orderId: string,
        userId: string,
        tx?: DbTx,
    ): Promise<Order | undefined>;
    listStalePendingPaymentOrderIds(olderThan: Date, limit: number): Promise<string[]>;
    clearCart(cartId: string): Promise<void>;
}

export class OrderRepository implements IOrderRepository {
    async findById(id: string): Promise<Order | undefined> {
        const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
        return row;
    }

    async findByIdForUser(id: string, userId: string): Promise<Order | undefined> {
        const [row] = await db
            .select()
            .from(orders)
            .where(and(eq(orders.id, id), eq(orders.userId, userId)))
            .limit(1);
        return row;
    }

    async findByIdempotency(userId: string, idempotencyKey: string): Promise<Order | undefined> {
        const [row] = await db
            .select()
            .from(orders)
            .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, idempotencyKey)))
            .limit(1);
        return row;
    }

    async loadWithItems(orderId: string): Promise<OrderWithItems | undefined> {
        const order = await this.findById(orderId);
        if (!order) return undefined;

        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        const withAddons: OrderItemWithAddons[] = [];
        for (const item of items) {
            const addons = await db
                .select()
                .from(orderItemAddons)
                .where(eq(orderItemAddons.orderItemId, item.id));
            withAddons.push({ ...item, addons });
        }
        return { ...order, items: withAddons };
    }

    async listForUser(
        userId: string,
        pagination: PaginationQuery,
        bucket: UserOrderListBucket = "all",
    ): Promise<{ items: OrderListRow[]; total: number }> {
        const conditions: SQL[] = [eq(orders.userId, userId)];
        if (bucket === "completed") {
            conditions.push(eq(orders.status, "COMPLETED"));
        } else if (bucket === "cancelled") {
            conditions.push(eq(orders.status, "CANCELLED"));
        } else if (bucket === "upcoming") {
            conditions.push(notInArray(orders.status, ["COMPLETED", "CANCELLED"]));
        }
        const where = conditions.length === 1 ? conditions[0] : and(...conditions);
        return this.listRows(where, pagination, "scheduled_at");
    }

    async listAdmin(
        filter: AdminOrderListFilter,
        pagination: PaginationQuery,
    ): Promise<{ items: OrderListRow[]; total: number }> {
        const conditions: SQL[] = [];
        const q = filter.q?.trim();
        if (q) {
            const pattern = `%${q}%`;
            conditions.push(
                or(
                    ilike(orders.reference, pattern),
                    sql`cast(${orders.id} as text) ilike ${pattern}`,
                    ilike(orders.customerName, pattern),
                    ilike(orders.customerPhone, pattern),
                    ilike(orders.customerEmail, pattern),
                    ilike(orders.pincode, pattern),
                )!,
            );
        }
        if (filter.statuses?.length) {
            conditions.push(inArray(orders.status, filter.statuses));
        }
        if (filter.cityId) {
            conditions.push(eq(orders.cityId, filter.cityId));
        }
        if (filter.paymentMethod) {
            conditions.push(eq(orders.paymentMethod, filter.paymentMethod));
        }
        if (filter.userId) {
            conditions.push(eq(orders.userId, filter.userId));
        }
        if (filter.vendorId) {
            conditions.push(
                exists(
                    db
                        .select({ one: sql`1` })
                        .from(assignments)
                        .where(
                            and(
                                eq(assignments.orderId, orders.id),
                                eq(assignments.vendorId, filter.vendorId),
                            ),
                        ),
                ),
            );
        }
        if (filter.fulfillmentType) {
            conditions.push(eq(orders.fulfillmentType, filter.fulfillmentType));
        }
        if (filter.dispatchStatus) {
            conditions.push(eq(orders.dispatchStatus, filter.dispatchStatus));
        }
        const where = conditions.length ? and(...conditions) : undefined;
        return this.listRows(where, pagination, filter.sort ?? "scheduled_at");
    }

    private async listRows(
        where: SQL | undefined,
        pagination: PaginationQuery,
        sort: "scheduled_at" | "created_at",
    ): Promise<{ items: OrderListRow[]; total: number }> {
        const orderBy =
            sort === "created_at" ? desc(orders.createdAt) : desc(orders.scheduledAt);
        const [totalRow] = await db.select({ value: count() }).from(orders).where(where);
        const rows = await db
            .select()
            .from(orders)
            .where(where)
            .orderBy(orderBy)
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        if (!rows.length) {
            return { items: [], total: Number(totalRow?.value ?? 0) };
        }

        return { items: await this.enrichListRows(rows), total: Number(totalRow?.value ?? 0) };
    }

    private async enrichListRows(rows: Order[]): Promise<OrderListRow[]> {
        const orderIds = rows.map((row) => row.id);
        const lineItems = await db
            .select()
            .from(orderItems)
            .where(inArray(orderItems.orderId, orderIds))
            .orderBy(asc(orderItems.createdAt));

        const itemsByOrder = new Map<string, OrderItem[]>();
        for (const item of lineItems) {
            const list = itemsByOrder.get(item.orderId) ?? [];
            list.push(item);
            itemsByOrder.set(item.orderId, list);
        }

        return rows.map((order) => {
            const orderLineItems = itemsByOrder.get(order.id) ?? [];
            const primary = orderLineItems[0];
            return {
                ...order,
                primaryName: primary?.productName ?? "Decoration booking",
                primaryImageUrl: primary?.imageUrl ?? null,
                itemCount: orderLineItems.length,
            };
        });
    }

    async insertOrderWithItems(payload: OrderInsertPayload): Promise<OrderWithItems> {
        return db.transaction(async (tx) => this.insertOrderWithItemsInTx(tx, payload));
    }

    async createWithItems(
        payload: OrderInsertPayload,
        cartId: string,
        options?: { clearCart?: boolean },
    ): Promise<OrderWithItems> {
        return this.createWithItemsAndRedemption(payload, cartId, null, options);
    }

    async createWithItemsAndRedemption(
        payload: OrderInsertPayload,
        cartId: string,
        redemption: { couponId: string; userId: string; code: string; discountPaise: number } | null,
        options?: { clearCart?: boolean },
    ): Promise<OrderWithItems> {
        const clearCart = options?.clearCart ?? true;
        return db.transaction(async (tx) => {
            const created = await this.insertOrderWithItemsInTx(tx, payload);
            if (redemption) {
                await tx.insert(couponRedemptions).values({
                    couponId: redemption.couponId,
                    orderId: created.id,
                    userId: redemption.userId,
                    code: redemption.code,
                    discountPaise: redemption.discountPaise,
                });
            }
            if (clearCart) {
                await this.deleteCartInTx(tx, cartId);
            }
            return created;
        });
    }

    private async insertOrderWithItemsInTx(
        tx: DbTx,
        payload: OrderInsertPayload,
    ): Promise<OrderWithItems> {
        const [order] = await tx
            .insert(orders)
            .values({
                reference: payload.reference,
                userId: payload.userId,
                status: payload.status,
                paymentMethod: payload.paymentMethod,
                source: payload.source ?? "web",
                createdByAdminId: payload.createdByAdminId ?? null,
                adminNotes: payload.adminNotes ?? null,
                isCustomPackage: payload.isCustomPackage ?? false,
                cityId: payload.cityId,
                pincode: payload.pincode,
                fulfillmentType: payload.fulfillmentType ?? "scheduled",
                dispatchStatus: payload.dispatchStatus ?? "idle",
                dispatchExhaustedAt: payload.dispatchExhaustedAt ?? null,
                deliveryLatitude: payload.deliveryLatitude ?? null,
                deliveryLongitude: payload.deliveryLongitude ?? null,
                deliveryGeoSource: payload.deliveryGeoSource ?? null,
                deliveryGeoAt: payload.deliveryGeoAt ?? null,
                scheduledAt: payload.scheduledAt,
                subtotalPaise: payload.subtotalPaise,
                discountPaise: payload.discountPaise ?? 0,
                couponId: payload.couponId ?? null,
                couponCode: payload.couponCode ?? null,
                customerName: payload.customerName,
                customerPhone: payload.customerPhone,
                customerEmail: payload.customerEmail,
                addressLine: payload.addressLine,
                landmark: payload.landmark ?? null,
                cityName: payload.cityName,
                idempotencyKey: payload.idempotencyKey ?? null,
                collectionStatus:
                    payload.collectionStatus ??
                    (payload.paymentMethod === "COD" ? "pending" : "not_required"),
            })
            .returning();
        if (!order) throw new Error("failed to create order");

        const insertedItems: OrderItemWithAddons[] = [];
        for (const line of payload.items) {
            const [item] = await tx
                .insert(orderItems)
                .values({
                    orderId: order.id,
                    productId: line.productId,
                    productName: line.productName,
                    imageUrl: line.imageUrl ?? null,
                    quantity: line.quantity,
                    productPaise: line.productPaise,
                    addonsPaise: line.addonsPaise,
                    lineTotalPaise: line.lineTotalPaise,
                })
                .returning();
            if (!item) throw new Error("failed to create order item");

            const addonRows: OrderItemAddon[] = [];
            for (const addon of line.addons) {
                const [addonRow] = await tx
                    .insert(orderItemAddons)
                    .values({
                        orderItemId: item.id,
                        addonId: addon.addonId,
                        addonName: addon.addonName,
                        pricePaise: addon.pricePaise,
                        quantity: addon.quantity,
                    })
                    .returning();
                if (!addonRow) throw new Error("failed to create order addon");
                addonRows.push(addonRow);
            }
            insertedItems.push({ ...item, addons: addonRows });
        }

        return { ...order, items: insertedItems };
    }

    async confirmOrder(orderId: string, userId: string): Promise<Order | undefined> {
        const [row] = await db
            .update(orders)
            .set({
                status: "CONFIRMED",
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, "PENDING_PAYMENT")))
            .returning();
        return row;
    }

    async markAssigned(orderId: string, tx?: DbTx): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "ASSIGNED",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(orders.id, orderId),
                    inArray(orders.status, ["CONFIRMED", "ASSIGNED"]),
                ),
            )
            .returning();
        return row;
    }

    async markEnRoute(orderId: string, tx?: DbTx): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "EN_ROUTE",
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), eq(orders.status, "ASSIGNED")))
            .returning();
        return row;
    }

    async markOnSite(orderId: string, tx?: DbTx): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "ON_SITE",
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), eq(orders.status, "EN_ROUTE")))
            .returning();
        return row;
    }

    async markConfirmed(orderId: string, tx?: DbTx): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "CONFIRMED",
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), eq(orders.status, "ASSIGNED")))
            .returning();
        return row;
    }

    async markCompleted(orderId: string, tx?: DbTx): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "COMPLETED",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(orders.id, orderId),
                    inArray(orders.status, ["ON_SITE", "DISPUTED"]),
                ),
            )
            .returning();
        return row;
    }

    async markCancelled(orderId: string, tx?: DbTx): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "CANCELLED",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(orders.id, orderId),
                    inArray(orders.status, [
                        "DRAFT",
                        "PENDING_PAYMENT",
                        "CONFIRMED",
                        "ASSIGNED",
                        "DISPUTED",
                    ]),
                ),
            )
            .returning();
        return row;
    }

    async cancelPendingPaymentForUser(
        orderId: string,
        userId: string,
        tx?: DbTx,
    ): Promise<Order | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(orders)
            .set({
                status: "CANCELLED",
                idempotencyKey: null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(orders.id, orderId),
                    eq(orders.userId, userId),
                    eq(orders.status, "PENDING_PAYMENT"),
                ),
            )
            .returning();
        if (!row) return undefined;
        await client.delete(couponRedemptions).where(eq(couponRedemptions.orderId, orderId));
        return row;
    }

    async listStalePendingPaymentOrderIds(olderThan: Date, limit: number): Promise<string[]> {
        const rows = await db
            .select({ id: orders.id })
            .from(orders)
            .where(and(eq(orders.status, "PENDING_PAYMENT"), lt(orders.createdAt, olderThan)))
            .orderBy(asc(orders.createdAt))
            .limit(limit);
        return rows.map((row) => row.id);
    }

    async clearCart(cartId: string): Promise<void> {
        await db.transaction(async (tx) => {
            await this.deleteCartInTx(tx, cartId);
        });
    }

    private async deleteCartInTx(tx: DbTx, cartId: string): Promise<void> {
        const items = await tx.select().from(cartItems).where(eq(cartItems.cartId, cartId));
        for (const item of items) {
            await tx.delete(cartItemAddons).where(eq(cartItemAddons.cartItemId, item.id));
        }
        await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
        await tx.delete(carts).where(eq(carts.id, cartId));
    }
}
