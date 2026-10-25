import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ORDER_STATUSES } from "@/modules/booking/domain/order-status.js";
import {
    queryCatalogAddons,
    queryCatalogCities,
    queryCatalogMedia,
    queryCatalogProducts,
    queryOrderStats,
    queryRecentEdits,
    queryTopProducts,
} from "./analytics-queries.js";

const dateRangeSchema = {
    from: z.string().describe("Range start (ISO-8601 date or datetime)"),
    to: z.string().describe("Range end (ISO-8601 date or datetime)"),
};

export const getOrderStatsTool = createTool({
    id: "get-order-stats",
    description:
        "Order counts and GMV for a date range. GMV excludes DRAFT and CANCELLED. Use for booking volume and revenue questions. Range is capped at 90 days.",
    inputSchema: z.object({
        ...dateRangeSchema,
        status: z.enum(ORDER_STATUSES).optional().describe("Optional order status filter"),
    }),
    outputSchema: z.object({
        from: z.string(),
        to: z.string(),
        clamped: z.boolean(),
        status: z.string().nullable(),
        orderCount: z.number(),
        gmvPaise: z.number(),
        gmvLabel: z.string(),
        byStatus: z.array(z.object({ status: z.string(), count: z.number() })),
        empty: z.boolean(),
        emptyMessage: z.string().nullable(),
        gmvExcludedStatuses: z.array(z.string()),
    }),
    execute: async (input) => queryOrderStats(input),
});

export const getKnownMetricTool = createTool({
    id: "get-known-metric",
    description:
        "Run an approved metric. order_stats = booking counts and GMV. top_products = sold packages with imageUrl. catalog_products = product cards. catalog_addons = addon cards. catalog_media = media-library images. recent_edits = last admin changes on the platform. Prefer this over SQL. If empty is true, always render Callout using emptyMessage — never a blank answer.",
    inputSchema: z.object({
        metric: z.enum([
            "order_stats",
            "top_products",
            "catalog_products",
            "catalog_addons",
            "catalog_media",
            "recent_edits",
            "catalog_cities",
        ]),
        from: z.string().describe("Range start (ISO-8601)"),
        to: z.string().describe("Range end (ISO-8601)"),
        status: z.enum(ORDER_STATUSES).optional(),
        limit: z.number().int().min(1).max(40).optional(),
        kind: z
            .enum(["image", "video", "file", "all"])
            .optional()
            .describe("Only for catalog_media. Default image."),
    }),
    execute: async (input) => {
        if (input.metric === "top_products") {
            return { metric: input.metric, ...(await queryTopProducts(input)) };
        }
        if (input.metric === "catalog_products") {
            return { metric: input.metric, ...(await queryCatalogProducts(input)) };
        }
        if (input.metric === "catalog_addons") {
            return { metric: input.metric, ...(await queryCatalogAddons(input)) };
        }
        if (input.metric === "catalog_media") {
            return { metric: input.metric, ...(await queryCatalogMedia(input)) };
        }
        if (input.metric === "recent_edits") {
            return { metric: input.metric, ...(await queryRecentEdits(input)) };
        }
        if (input.metric === "catalog_cities") {
            return { metric: input.metric, ...(await queryCatalogCities()) };
        }
        return { metric: input.metric, ...(await queryOrderStats(input)) };
    },
});

export const getTopProductsTool = createTool({
    id: "get-top-products",
    description:
        "Top catalog products by line GMV in a date range. Excludes DRAFT and CANCELLED orders. Limit 1–20, default 10. Range capped at 90 days.",
    inputSchema: z.object({
        ...dateRangeSchema,
        limit: z.number().int().min(1).max(20).optional(),
    }),
    outputSchema: z.object({
        from: z.string(),
        to: z.string(),
        clamped: z.boolean(),
        limit: z.number(),
        items: z.array(
            z.object({
                productId: z.string(),
                productName: z.string(),
                imageUrl: z.string(),
                quantity: z.number(),
                gmvPaise: z.number(),
                gmvLabel: z.string(),
                priceLabel: z.string(),
                compareAtLabel: z.string(),
                percentOff: z.number(),
                instantLabel: z.string(),
                badgeLabel: z.string(),
            }),
        ),
        empty: z.boolean(),
        emptyMessage: z.string().nullable(),
    }),
    execute: async (input) => queryTopProducts(input),
});
