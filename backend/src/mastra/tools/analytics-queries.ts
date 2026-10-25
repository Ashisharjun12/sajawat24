import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { ORDER_STATUSES, type OrderStatus } from "@/modules/booking/domain/order-status.js";
import { orderItems, orders } from "@/modules/booking/orders/order.schema.js";
import { addonColors, addons, productAddons } from "@/modules/catalog/addons/addon.schema.js";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { cityPrices } from "@/modules/catalog/pricing/city-price.schema.js";
import { productImages, products } from "@/modules/catalog/products/product.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { auditLogs } from "@/modules/ops/audit/audit-log.schema.js";
import { resolveCompletedDisplayUrls } from "@/modules/upload/index.js";
import { uploads, type MediaKind } from "@/modules/upload/media/media.schema.js";
import { formatInrFromPaise, resolveAnalyticsWindow, type DateWindow } from "./analytics-date.js";
import { resolveCityCoordinates } from "./geo-coords.js";

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
    const emptyOrderLabel = status === "PENDING_PAYMENT"
        ? "pending"
        : status?.toLowerCase().replaceAll("_", " ");

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
        emptyMessage: orderCount === 0
            ? emptyOrderLabel
                ? `No ${emptyOrderLabel} orders in this date range.`
                : "No orders in this date range."
            : null,
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
    const label = (row.instantBadgeLabel || "").trim() || "Instant";
    if (row.instantShowBadge !== false) {
        parts.push(label);
    }
    if (row.instantEtaMinutes != null) {
        parts.push(`~${row.instantEtaMinutes} min`);
    }
    if (parts.length === 0) {
        parts.push("Instant");
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

    const nullPriceIds = rows.filter((r) => r.pricePaise == null).map((r) => r.id);
    if (nullPriceIds.length > 0) {
        const cityRows = await db
            .select({
                productId: cityPrices.productId,
                minPrice: sql<number>`min(${cityPrices.pricePaise})`,
                compareAt: sql<number>`min(${cityPrices.compareAtPaise})`,
            })
            .from(cityPrices)
            .where(inArray(cityPrices.productId, nullPriceIds))
            .groupBy(cityPrices.productId);
        const cityMap = new Map(cityRows.map((c) => [c.productId, c]));
        for (const row of rows) {
            if (row.pricePaise == null && cityMap.has(row.id)) {
                const c = cityMap.get(row.id)!;
                row.pricePaise = c.minPrice;
                row.compareAtPaise = c.compareAt;
            }
        }
    }

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

    const nullPriceIds = rows.filter((r) => r.pricePaise == null).map((r) => r.id);
    if (nullPriceIds.length > 0) {
        const cityRows = await db
            .select({
                productId: cityPrices.productId,
                minPrice: sql<number>`min(${cityPrices.pricePaise})`,
                compareAt: sql<number>`min(${cityPrices.compareAtPaise})`,
            })
            .from(cityPrices)
            .where(inArray(cityPrices.productId, nullPriceIds))
            .groupBy(cityPrices.productId);
        const cityMap = new Map(cityRows.map((c) => [c.productId, c]));
        for (const row of rows) {
            if (row.pricePaise == null && cityMap.has(row.id)) {
                const c = cityMap.get(row.id)!;
                row.pricePaise = c.minPrice;
                row.compareAtPaise = c.compareAt;
            }
        }
    }

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

export async function queryProductDetails(productId: string) {
    const [row] = await db
        .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            categoryName: categories.name,
            isActive: products.isActive,
            scheduledEnabled: products.scheduledEnabled,
            instantEnabled: products.instantEnabled,
            instantShowBadge: products.instantShowBadge,
            instantBadgeLabel: products.instantBadgeLabel,
            instantPdpNote: products.instantPdpNote,
            instantEtaMinutes: products.instantEtaMinutes,
            paymentCod: products.paymentCod,
            paymentOnline: products.paymentOnline,
            pricePaise: products.pricePaise,
            compareAtPaise: products.compareAtPaise,
            includes: products.includes,
            deliverySetup: products.deliverySetup,
            careInstructions: products.careInstructions,
            faqs: products.faqs,
            ratingAvg: products.ratingAvg,
            reviewCount: products.reviewCount,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, productId))
        .limit(1);

    if (!row) {
        return {
            items: [],
            columns: ["Field", "Details"],
            rows: [],
            empty: true,
            emptyMessage: "That product could not be found. It may have been removed.",
        };
    }

    const [imageRows, addonRows, cityPriceRows] = await Promise.all([
        db
            .select({
                uploadId: productImages.uploadId,
                sortIndex: productImages.sortIndex,
            })
            .from(productImages)
            .where(eq(productImages.productId, row.id))
            .orderBy(asc(productImages.sortIndex)),
        db
            .select({
                id: addons.id,
                name: addons.name,
                slug: addons.slug,
                description: addons.description,
                imageUploadId: addons.imageUploadId,
                colorName: addonColors.name,
                colorHex: addonColors.hex,
                pricePaise: addons.pricePaise,
                compareAtPaise: addons.compareAtPaise,
                maxQuantity: addons.maxQuantity,
            })
            .from(productAddons)
            .innerJoin(addons, eq(productAddons.addonId, addons.id))
            .leftJoin(addonColors, eq(addons.colorId, addonColors.id))
            .where(and(eq(productAddons.productId, row.id), eq(addons.isActive, true)))
            .orderBy(asc(addons.name)),
        db
            .select({
                cityId: cities.id,
                cityName: cities.name,
                citySlug: cities.slug,
                state: cities.state,
                pricePaise: cityPrices.pricePaise,
                compareAtPaise: cityPrices.compareAtPaise,
            })
            .from(cityPrices)
            .innerJoin(cities, eq(cityPrices.cityId, cities.id))
            .where(eq(cityPrices.productId, row.id))
            .orderBy(asc(cities.name)),
    ]);

    const imageUploadIds = imageRows.map((r) => r.uploadId);
    const addonUploadIds = addonRows
        .map((r) => r.imageUploadId)
        .filter((id): id is string => Boolean(id));
    const allUploadIds = [...new Set([...imageUploadIds, ...addonUploadIds])];
    const resolvedUrls = await resolveCompletedDisplayUrls(allUploadIds);

    const images: string[] = imageRows
        .map((r) => resolvedUrls.get(r.uploadId))
        .filter((url): url is string => Boolean(url));

    const addonItems = addonRows.map((addon) => {
        const pricePaise = addon.pricePaise == null ? null : Number(addon.pricePaise);
        const compareAtPaise = addon.compareAtPaise == null ? null : Number(addon.compareAtPaise);
        const imageUrl = addon.imageUploadId ? (resolvedUrls.get(addon.imageUploadId) ?? "") : "";
        return {
            id: addon.id,
            name: addon.name,
            slug: addon.slug,
            description: addon.description ?? "",
            imageUrl,
            colorName: addon.colorName ?? "",
            colorHex: addon.colorHex ?? "",
            pricePaise,
            priceLabel: pricePaise == null ? "" : formatInrFromPaise(pricePaise),
            compareAtPaise,
            compareAtLabel:
                pricePaise != null && compareAtPaise != null && compareAtPaise > pricePaise
                    ? formatInrFromPaise(compareAtPaise)
                    : "",
            percentOff: pricePaise == null ? 0 : discountPercent(pricePaise, compareAtPaise),
            maxQuantity: addon.maxQuantity,
        };
    });

    const cityPriceItems = cityPriceRows.map((price) => {
        const amount = Number(price.pricePaise);
        const compare = price.compareAtPaise == null ? null : Number(price.compareAtPaise);
        return {
            cityId: price.cityId,
            cityName: price.cityName,
            citySlug: price.citySlug,
            state: price.state,
            pricePaise: amount,
            priceLabel: formatInrFromPaise(amount),
            compareAtPaise: compare,
            compareAtLabel: compare != null && compare > amount ? formatInrFromPaise(compare) : "",
            percentOff: discountPercent(amount, compare),
        };
    });

    let pricePaise = row.pricePaise == null ? null : Number(row.pricePaise);
    let compareAtPaise = row.compareAtPaise == null ? null : Number(row.compareAtPaise);
    if (pricePaise == null && cityPriceItems.length > 0) {
        pricePaise = cityPriceItems[0].pricePaise;
        compareAtPaise = cityPriceItems[0].compareAtPaise;
    }

    const instantLabel = instantLine({
        instantEnabled: row.instantEnabled,
        instantShowBadge: row.instantShowBadge,
        instantBadgeLabel: row.instantBadgeLabel,
        instantEtaMinutes: row.instantEtaMinutes,
    });

    const includes = Array.isArray(row.includes) ? row.includes : [];
    const deliverySetup = Array.isArray(row.deliverySetup) ? row.deliverySetup : [];
    const careInstructions = Array.isArray(row.careInstructions) ? row.careInstructions : [];
    const faqs = Array.isArray(row.faqs) ? row.faqs : [];

    const detail = {
        id: row.id,
        productId: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        categoryName: row.categoryName ?? "",
        isActive: row.isActive,
        pricePaise,
        priceLabel: pricePaise == null ? "" : formatInrFromPaise(pricePaise),
        compareAtPaise,
        compareAtLabel:
            pricePaise != null && compareAtPaise != null && compareAtPaise > pricePaise
                ? formatInrFromPaise(compareAtPaise)
                : "",
        percentOff: pricePaise == null ? 0 : discountPercent(pricePaise, compareAtPaise),
        imageUrl: images[0] ?? "",
        images,
        instant: {
            enabled: Boolean(row.instantEnabled),
            showBadge: Boolean(row.instantShowBadge),
            badgeLabel: (row.instantBadgeLabel || "Instant").trim() || "Instant",
            etaMinutes: row.instantEtaMinutes,
            pdpNote: row.instantPdpNote ?? "",
            instantLine: instantLabel,
        },
        scheduled: {
            enabled: Boolean(row.scheduledEnabled),
            label: row.scheduledEnabled ? "Available" : "Disabled",
            slots: [
                "Morning (9:00 AM - 12:00 PM)",
                "Afternoon (12:00 PM - 3:00 PM)",
                "Evening (3:00 PM - 6:00 PM)",
                "Night (6:00 PM - 9:00 PM)",
            ],
        },
        payments: {
            cod: Boolean(row.paymentCod),
            online: Boolean(row.paymentOnline),
        },
        ratingAvg: row.ratingAvg == null ? null : Number(row.ratingAvg),
        reviewCount: row.reviewCount ?? 0,
        includes,
        deliverySetup,
        careInstructions,
        faqs,
        addons: addonItems,
        cityPrices: cityPriceItems,
    };

    const rows: string[][] = [
        ["Product ID", row.id],
        ["Slug", row.slug],
        ["Description", row.description ?? ""],
        ["Category", row.categoryName ?? ""],
        ["Status", row.isActive ? "Active" : "Inactive"],
        ["Base price", detail.priceLabel],
        ["Compare-at price", detail.compareAtLabel],
        ["Scheduled booking", row.scheduledEnabled ? "Enabled" : "Disabled"],
        ["Instant booking", instantLabel || (row.instantEnabled ? "Enabled" : "Disabled")],
        ["Instant booking note", row.instantPdpNote ?? ""],
        ["Payment methods", [
            row.paymentCod ? "Cash on delivery" : "",
            row.paymentOnline ? "Online payment" : "",
        ].filter(Boolean).join(", ")],
        ["Includes", includes.join(", ")],
        ["Delivery/setup", deliverySetup.join(", ")],
        ["Care instructions", careInstructions.join(", ")],
        ["Rating", row.ratingAvg == null ? "" : `${row.ratingAvg} (${row.reviewCount} reviews)`],
        ["Addons", addonItems.map((a) => `${a.name} (${a.priceLabel})`).join(", ")],
        ["City prices", cityPriceItems.map((p) => `${p.cityName}: ${p.priceLabel}${p.compareAtLabel ? ` (compare at ${p.compareAtLabel})` : ""}`).join("; ")],
    ];
    for (const [index, faq] of faqs.entries()) {
        rows.push([`FAQ ${index + 1}`, `${faq.question}: ${faq.answer}`]);
    }

    return {
        detail,
        items: [{
            productId: row.id,
            name: row.name,
            imageUrl: images[0] ?? "",
            images,
            ...detail,
        }],
        columns: ["Field", "Details"],
        rows: rows.filter(([, value]) => value !== ""),
        empty: false,
        emptyMessage: null,
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

    const items = rows.map((row) => {
        const coords = resolveCityCoordinates(row.name, row.state);
        return {
            name: row.name,
            slug: row.slug,
            state: row.state,
            imageUrl: row.imageUploadId ? (urls.get(row.imageUploadId) ?? "") : "",
            latitude: coords[0],
            longitude: coords[1],
        };
    });
    const empty = items.length === 0;
    return {
        columns: ["image", "name", "slug", "state"],
        rows: items.map((item) => [item.imageUrl, item.name, item.slug, item.state]),
        items,
        empty,
        emptyMessage: empty ? "No active service cities." : null,
    };
}

export async function queryCatalogCategories() {
    const rows = await db
        .select({
            id: categories.id,
            name: categories.name,
            parentId: categories.parentId,
            imageUploadId: categories.imageUploadId,
        })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.name));

    const urls = await resolveCompletedDisplayUrls(
        rows.map((row) => row.imageUploadId).filter((id): id is string => Boolean(id)),
    );
    const categoriesById = new Map(rows.map((row) => [row.id, row]));
    const items = rows.map((row) => ({
        id: row.id,
        name: row.name,
        parentCategory: row.parentId ? (categoriesById.get(row.parentId)?.name ?? "") : "",
        imageUrl: row.imageUploadId ? (urls.get(row.imageUploadId) ?? "") : "",
    }));
    return {
        columns: ["category / subcategory", "parent category"],
        rows: items.map((item) => [item.name, item.parentCategory]),
        items,
        empty: items.length === 0,
        emptyMessage: items.length === 0 ? "No active categories or subcategories." : null,
    };
}

export async function queryEntityTotals() {
    const [userRow] = await db.select({ n: sql<number>`count(${users.id})::int` }).from(users);
    const [productRow] = await db.select({ n: sql<number>`count(${products.id})::int` }).from(products);
    const [categoryRow] = await db.select({ n: sql<number>`count(${categories.id})::int` }).from(categories);
    const [addonRow] = await db.select({ n: sql<number>`count(${addons.id})::int` }).from(addons);
    const labels = ["Users", "Products", "Categories", "Addons"];
    const values = [
        Number(userRow?.n ?? 0),
        Number(productRow?.n ?? 0),
        Number(categoryRow?.n ?? 0),
        Number(addonRow?.n ?? 0),
    ];
    const items = labels.map((label, index) => ({ label, value: values[index] }));
    return {
        labels,
        values,
        items,
        columns: ["label", "value"],
        rows: items.map((item) => [item.label, String(item.value)]),
    };
}

function utcDayKey(value: Date | string): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
}

function enumerateUtcDays(from: Date, to: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    while (cursor.getTime() <= last.getTime() && days.length < 90) {
        days.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
}

async function fillDayCounts(
    rows: Array<{ day: string; n: number }>,
    days: string[],
): Promise<number[]> {
    const map = new Map<string, number>();
    for (const row of rows) {
        map.set(utcDayKey(row.day), Number(row.n ?? 0));
    }
    return days.map((day) => map.get(day) ?? 0);
}

export async function queryDailyCounts(input: { from: string; to: string }) {
    const window = resolveAnalyticsWindow(input.from, input.to);
    const labels = enumerateUtcDays(window.from, window.to);
    const [userRows, productRows, orderRows] = await Promise.all([
        db
            .select({
                day: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`,
                n: sql<number>`count(*)::int`,
            })
            .from(users)
            .where(and(gte(users.createdAt, window.from), lte(users.createdAt, window.to)))
            .groupBy(sql`date_trunc('day', ${users.createdAt})`),
        db
            .select({
                day: sql<string>`to_char(date_trunc('day', ${products.createdAt}), 'YYYY-MM-DD')`,
                n: sql<number>`count(*)::int`,
            })
            .from(products)
            .where(and(gte(products.createdAt, window.from), lte(products.createdAt, window.to)))
            .groupBy(sql`date_trunc('day', ${products.createdAt})`),
        db
            .select({
                day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
                n: sql<number>`count(*)::int`,
            })
            .from(orders)
            .where(and(gte(orders.createdAt, window.from), lte(orders.createdAt, window.to)))
            .groupBy(sql`date_trunc('day', ${orders.createdAt})`),
    ]);
    const [userCounts, productCounts, orderCounts] = await Promise.all([
        fillDayCounts(userRows, labels),
        fillDayCounts(productRows, labels),
        fillDayCounts(orderRows, labels),
    ]);
    const seriesValues = [userCounts, productCounts, orderCounts];
    const empty = seriesValues.every((series) => series.every((value) => value === 0));
    return {
        from: window.fromIso,
        to: window.toIso,
        clamped: window.clamped,
        labels,
        seriesNames: ["Users", "Products", "Orders"],
        seriesValues,
        empty,
        emptyMessage: empty ? "No users, products, or orders created in this date range." : null,
    };
}
