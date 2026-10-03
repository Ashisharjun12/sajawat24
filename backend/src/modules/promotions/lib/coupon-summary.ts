import type { Coupon } from "@/modules/promotions/coupons/coupon.schema.js";

export type CouponTargetLabel = { id: string; name: string };

function formatInrPaise(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function buildCouponEligibilitySummary(
    coupon: Pick<
        Coupon,
        | "type"
        | "valuePaise"
        | "percentBps"
        | "maxDiscountPaise"
        | "minOrderPaise"
        | "scope"
        | "firstOrderOnly"
        | "allowedPaymentMethods"
    >,
    opts: {
        cityName?: string | null;
        targets?: CouponTargetLabel[];
    } = {},
): string {
    const parts: string[] = [];

    if (coupon.type === "flat" && coupon.valuePaise) {
        parts.push(`${formatInrPaise(coupon.valuePaise)} off`);
    } else if (coupon.type === "percent" && coupon.percentBps) {
        const pct = coupon.percentBps / 100;
        let line = `${pct}% off`;
        if (coupon.maxDiscountPaise) {
            line += ` (up to ${formatInrPaise(coupon.maxDiscountPaise)})`;
        }
        parts.push(line);
    }

    if (coupon.scope === "entire_cart") {
        parts.push("entire cart");
    } else if (coupon.scope === "products") {
        const names = opts.targets?.map((t) => t.name) ?? [];
        if (names.length === 1) parts.push(`product “${names[0]}”`);
        else if (names.length > 1) parts.push(`${names.length} selected products`);
        else parts.push("selected products");
    } else if (coupon.scope === "categories") {
        const names = opts.targets?.map((t) => t.name) ?? [];
        if (names.length === 1) parts.push(`“${names[0]}” category`);
        else if (names.length > 1) parts.push(`${names.length} categories`);
        else parts.push("selected categories");
    }

    if (opts.cityName) {
        parts.push(`in ${opts.cityName}`);
    }

    let summary = parts.join(" ");

    const conditions: string[] = [];
    if (coupon.minOrderPaise > 0) {
        conditions.push(`Min order ${formatInrPaise(coupon.minOrderPaise)}`);
    }
    if (coupon.firstOrderOnly) {
        conditions.push("First order only");
    }
    const methods = coupon.allowedPaymentMethods ?? [];
    if (methods.length === 1 && methods[0] === "online") {
        conditions.push("Online payment only");
    } else if (methods.length === 1 && methods[0] === "cod") {
        conditions.push("Cash on delivery only");
    }

    if (conditions.length) {
        summary += `. ${conditions.join(" · ")}`;
    }

    return summary.trim();
}
