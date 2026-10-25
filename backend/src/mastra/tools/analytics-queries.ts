import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { ORDER_STATUSES, type OrderStatus } from "@/modules/booking/domain/order-status.js";
import { orderItems, orders } from "@/modules/booking/orders/order.schema.js";
import { addonColors, addons } from "@/modules/catalog/addons/addon.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { productImages, products } from "@/modules/catalog/products/product.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { auditLogs } from "@/modules/ops/audit/audit-log.schema.js";
import { resolveCompletedDisplayUrls } from "@/modules/upload/index.js";
import { uploads, type MediaKind } from "@/modules/upload/media/media.schema.js";
import { formatInrFromPaise, resolveAnalyticsWindow, type DateWindow } from "./analytics-date.js";

const GM_EXCLUDED: OrderStatus[] = ["DRAFT", "CANCELLED"];

function orderWindowWhere(window: DateWindow, status?: OrderStatus): SQL {
    const parts: SQL[] = [
        gte(orders.createdAt, window.from),
        lte(orders.createdAt, window.to),
    ];
    if (status) {
        parts.push(eq(orders.status, status));
    }
    return and(...parts)!;
}

export async function queryOrderStats(input: {
    from: string;
    to: string;
    status?: string;
}) {
    const status = input.status
        ? ORDER_STATUSES.includes(input.status as OrderStatus)
            ? (input.status as OrderStatus)
            : undefined
        : undefined;
    const window = resolveAnalyticsWindow(input.from, input.to);
    const where = orderWindowWhere(window, status);

    const [totals] = await db
        .select({
            orderCount: sql<number>`count(*)::int`,
            gmvPaise: sql<number>`coalesce(sum(case when ${orders.status} not in ('DRAFT', 'CANCELLED') then ${orders.subtotalPaise} - ${orders.discountPaise} else 0 end), 0)::int`,
        })
        .from(orders)
        .where(where);

    const statusRows = await db
        .select({
            status: orders.status,
            count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(where)
        .groupBy(orders.status);

    const byStatus = ORDER_STATUSES.map((name) => ({
        status: name,
        count: Number(statusRows.find((row) => row.status === name)?.count ?? 0),
    })).filter((row) => row.count > 0);

    const gmvPaise = Number(totals?.gmvPaise ?? 0);
    const orderCount = Number(totals?.orderCount ?? 0);

    return {
        from: window.fromIso,
        to: window.toIso,
        clamped: window.clamped,
        status: status ?? null,
        orderCount,
        gmvPaise,
        gmvLabel: formatInrFromPaise(gmvPaise),
        byStatus,
        empty: orderCount === 0,
        emptyMessage: orderCount === 0 ? "No orders in this date range." : null,
        gmvExcludedStatuses: GM_EXCLUDED,
    };
}

async function imageUrlsByProductId(productIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(productIds.filter(Boolean))];
    const out = new Map<string, string>();
    if (unique.length === 0) return out;

    const images = await db
        .select({
            productId: productImages.productId,
            uploadId: productImages.uploadId,
        })
        .from(productImages)
        .where(inArray(productImages.productId, unique))
        .orderBy(asc(productImages.productId), asc(productImages.sortIndex));

    const firstUpload = new Map<string, string>();
    for (const row of images) {
        if (!firstUpload.has(row.productId)) {
            firstUpload.set(row.productId, row.uploadId);
        }
    }

    const urls = await resolveCompletedDisplayUrls([...firstUpload.values()]);
    for (const [productId, uploadId] of firstUpload) {
        out.set(productId, urls.get(uploadId) ?? "");
    }
    return out;
}

function discountPercent(pricePaise: number, compareAtPaise: number | null): number {
    if (compareAtPaise == null || compareAtPaise <= pricePaise) return 0;
    return Math.round((1 - pricePaise / compareAtPaise) * 100);
}

function instantLine(row: {
    instantEnabled: boolean | null;
    instantShowBadge: boolean | null;
    instantBadgeLabel: string | null;
    instantEtaMinutes: number | null;
}): string {
    if (!row.instantEnabled) return "";
    const parts: string[] = [];
    if (row.instantShowBadge) {
        parts.push((row.instantBadgeLabel || "Instant").trim() || "Instant");
    }
    if (row.instantEtaMinutes != null) {
        parts.push(`~${row.instantEtaMinutes} min`);
    }
    return parts.join(" · ");
}

type CatalogCardSource = {
    id: string;
    name: string;
    pricePaise: number | null;
    compareAtPaise: number | null;
    instantEnabled: boolean | null;
    instantShowBadge: boolean | null;
    instantBadgeLabel: string | null;
    instantEtaMinutes: number | null;
};

function toProductCardFields(
    row: CatalogCardSource,
    imageUrl: string,
    sales?: { quantity: number; gmvPaise: number; gmvLabel: string },
) {
    const pricePaise = row.pricePaise == null ? null : Number(row.pricePaise);
    const compareAtPaise = row.compareAtPaise == null ? null : Number(row.compareAtPaise);
    const percentOff = pricePaise == null ? 0 : discountPercent(pricePaise, compareAtPaise);
    return {
        productId: row.id,
        productName: row.name,
        imageUrl,
        quantity: sales?.quantity ?? 0,
        gmvPaise: sales?.gmvPaise ?? 0,
        gmvLabel: sales?.gmvLabel ?? "",
        priceLabel: pricePaise == null ? "" : formatInrFromPaise(pricePaise),
        compareAtLabel:
            pricePaise != null && compareAtPaise != null && compareAtPaise > pricePaise
                ? formatInrFromPaise(compareAtPaise)
                : "",
        percentOff,
        instantLabel: instantLine(row),
        badgeLabel: "",
    };
}

async function loadCatalogByIds(productIds: string[]): Promise<Map<string, CatalogCardSource>> {
    const unique = [...new Set(productIds.filter(Boolean))];
    const map = new Map<string, CatalogCardSource>();
    if (unique.length === 0) return map;
    const rows = await db
        .select({
            id: products.id,
            name: products.name,
            pricePaise: products.pricePaise,
            compareAtPaise: products.compareAtPaise,
            instantEnabled: products.instantEnabled,
            instantShowBadge: products.instantShowBadge,
            instantBadgeLabel: products.instantBadgeLabel,
            instantEtaMinutes: products.instantEtaMinutes,
        })
        .from(products)
        .where(inArray(products.id, unique));
    for (const row of rows) {
        map.set(row.id, row);
    }
    return map;
}

export async function queryTopProducts(input: { from: string; to: string; limit?: number }) {
    const window = resolveAnalyticsWindow(input.from, input.to);
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);
    const where = and(
        orderWindowWhere(window),
        sql`${orders.status} not in ('DRAFT', 'CANCELLED')`,
    )!;

    const rows = await db
        .select({
            productId: orderItems.productId,
            productName: sql<string>`min(${orderItems.productName})`,
            quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
            gmvPaise: sql<number>`coalesce(sum(${orderItems.lineTotalPaise}), 0)::int`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(where)
        .groupBy(orderItems.productId)
        .orderBy(desc(sql`sum(${orderItems.lineTotalPaise})`))
        .limit(limit);

    const productIds = rows.map((row) => row.productId);
    const [imageUrls, catalog] = await Promise.all([
        imageUrlsByProductId(productIds),
        loadCatalogByIds(productIds),
    ]);
    const items = rows.map((row) => {
        const product = catalog.get(row.productId);
        const gmvPaise = Number(row.gmvPaise ?? 0);
        const sales = {
            quantity: Number(row.quantity ?? 0),
            gmvPaise,
            gmvLabel: formatInrFromPaise(gmvPaise),
        };
        if (!product) {
            return {
                productId: row.productId,
                productName: row.productName,
                imageUrl: imageUrls.get(row.productId) ?? "",
                quantity: sales.quantity,
                gmvPaise: sales.gmvPaise,
                gmvLabel: sales.gmvLabel,
                priceLabel: "",
                compareAtLabel: "",
                percentOff: 0,
                instantLabel: "",
                badgeLabel: "",
            };
        }
        return toProductCardFields(product, imageUrls.get(row.productId) ?? "", sales);
    });

    const empty = items.length === 0;
    return {
        from: window.fromIso,
        to: window.toIso,
        clamped: window.clamped,
        limit,
        items,
        empty,
        emptyMessage: empty
            ? "No products sold in this date range. Drafts and cancellations are excluded."
            : null,
    };
}

export async function queryCatalogProducts(input: { limit?: number }) {
    const limit = Math.min(Math.max(input.limit ?? 12, 1), 20);
    const rows = await db
        .select({
            id: products.id,
            name: products.name,
            pricePaise: products.pricePaise,
            compareAtPaise: products.compareAtPaise,
            instantEnabled: products.instantEnabled,
            instantShowBadge: products.instantShowBadge,
            instantBadgeLabel: products.instantBadgeLabel,
            instantEtaMinutes: products.instantEtaMinutes,
        })
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(asc(products.name))
        .limit(limit);

    const imageUrls = await imageUrlsByProductId(rows.map((row) => row.id));
    const items = rows.map((row) => toProductCardFields(row, imageUrls.get(row.id) ?? ""));

    const empty = items.length === 0;
    return {
        limit,
        items,
        empty,
        emptyMessage: empty ? "No products in the catalog." : null,
    };
}

export async function queryCatalogAddons(input: { limit?: number }) {
    const limit = Math.min(Math.max(input.limit ?? 12, 1), 20);
    const rows = await db
        .select({
            id: addons.id,
            name: addons.name,
            pricePaise: addons.pricePaise,
            compareAtPaise: addons.compareAtPaise,
            imageUploadId: addons.imageUploadId,
            colorName: addonColors.name,
            colorHex: addonColors.hex,
        })
        .from(addons)
        .leftJoin(addonColors, eq(addons.colorId, addonColors.id))
        .where(eq(addons.isActive, true))
        .orderBy(asc(addons.name))
        .limit(limit);

    const urls = await resolveCompletedDisplayUrls(
        rows.map((row) => row.imageUploadId).filter((id): id is string => Boolean(id)),
    );

    const items = rows.map((row) => {
        const pricePaise = row.pricePaise == null ? null : Number(row.pricePaise);
        const compareAtPaise = row.compareAtPaise == null ? null : Number(row.compareAtPaise);
        const percentOff = pricePaise == null ? 0 : discountPercent(pricePaise, compareAtPaise);
        const isFree = pricePaise != null && pricePaise === 0;
        return {
            addonId: row.id,
            name: row.name,
            imageUrl: row.imageUploadId ? (urls.get(row.imageUploadId) ?? "") : "",
            priceLabel: isFree ? "Free" : pricePaise == null ? "" : formatInrFromPaise(pricePaise),
            compareAtLabel:
                pricePaise != null && compareAtPaise != null && compareAtPaise > pricePaise
                    ? formatInrFromPaise(compareAtPaise)
                    : "",
            percentOff,
            colorName: row.colorName ?? "",
            colorHex: row.colorHex ?? "",
        };
    });

    const empty = items.length === 0;
    return {
        limit,
        items,
        empty,
        emptyMessage: empty ? "No addons in the catalog." : null,
    };
}

function formatBytes(size: number | null): string {
    if (size == null || size < 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
    return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
}

export async function queryCatalogMedia(input: { limit?: number; kind?: string }) {
    const limit = Math.min(Math.max(input.limit ?? 24, 1), 40);
    const kind: MediaKind | null =
        input.kind === "video" || input.kind === "file" || input.kind === "image"
            ? input.kind
            : input.kind === "all"
              ? null
              : "image";

    const where = kind
        ? and(eq(uploads.status, "completed"), eq(uploads.kind, kind))
        : eq(uploads.status, "completed");

    const [countRow] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(uploads)
        .where(where);

    const rows = await db
        .select({
            id: uploads.id,
            filename: uploads.filename,
            kind: uploads.kind,
            mimeType: uploads.mimeType,
            size: uploads.size,
            width: uploads.width,
            height: uploads.height,
        })
        .from(uploads)
        .where(where)
        .orderBy(desc(uploads.createdAt))
        .limit(limit);

    const urls = await resolveCompletedDisplayUrls(rows.map((row) => row.id));
    const items = rows.map((row) => ({
        id: row.id,
        name: row.filename,
        imageUrl: urls.get(row.id) ?? "",
        kind: row.kind,
        mimeType: row.mimeType,
        sizeLabel: formatBytes(row.size),
        dimensions: row.width && row.height ? `${row.width}×${row.height}` : "",
    }));

    const total = Number(countRow?.value ?? 0);
    const empty = items.length === 0;
    return {
        limit,
        total,
        truncated: total > items.length,
        kind: kind ?? "all",
        items,
        empty,
        emptyMessage: empty
            ? kind === "image"
                ? "No completed images in the media library."
                : "No completed files in the media library."
            : null,
    };
}

export async function queryRecentEdits(input: { from: string; to: string; limit?: number }) {
    const window = resolveAnalyticsWindow(input.from, input.to);
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);

    const mapRow = (row: {
        action: string;
        entityType: string;
        entityId: string;
        summary: string;
        actorName: string | null;
        createdAt: Date;
    }) => ({
        when: row.createdAt.toISOString(),
        actorName: row.actorName?.trim() || "Unknown",
        action: row.action,
        entityType: row.entityType,
        summary: row.summary,
    });

    const selectEdits = (where: SQL | undefined) =>
        db
            .select({
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                summary: auditLogs.summary,
                actorName: users.name,
                createdAt: auditLogs.createdAt,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.actorId, users.id))
            .where(where)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);

    const windowWhere = and(gte(auditLogs.createdAt, window.from), lte(auditLogs.createdAt, window.to));
    let rows = await selectEdits(windowWhere);
    let widened = false;
    if (rows.length === 0) {
        rows = await selectEdits(undefined);
        widened = rows.length > 0;
    }

    const items = rows.map(mapRow);
    const empty = items.length === 0;
    const latest = items[0] ?? null;
    return {
        from: window.fromIso,
        to: window.toIso,
        clamped: window.clamped,
        widened,
        limit,
        latestWhen: latest?.when ?? null,
        latestSummary: latest?.summary ?? null,
        items,
        empty,
        emptyMessage: empty
            ? "No platform edits are recorded in audit history."
            : widened
              ? "No edits in the requested dates. Showing the most recent recorded edits instead."
              : null,
    };
}

export async function queryCatalogCities() {
    const rows = await db
        .select({
            name: cities.name,
            slug: cities.slug,
            state: cities.state,
            imageUploadId: cities.imageUploadId,
        })
        .from(cities)
        .where(eq(cities.isActive, true))
        .orderBy(asc(cities.name));

    const urls = await resolveCompletedDisplayUrls(
        rows.map((row) => row.imageUploadId).filter((id): id is string => Boolean(id)),
    );

    const items = rows.map((row) => ({
        name: row.name,
        slug: row.slug,
        state: row.state,
        imageUrl: row.imageUploadId ? (urls.get(row.imageUploadId) ?? "") : "",
    }));
    const empty = items.length === 0;
    return {
        columns: ["image", "name", "slug", "state"],
        rows: items.map((item) => [item.imageUrl, item.name, item.slug, item.state]),
        items,
        empty,
        emptyMessage: empty ? "No active service cities." : null,
    };
}
