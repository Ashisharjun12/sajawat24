import { ApiError } from "@/shared/errors/apiError.js";
import { getProductForCity } from "@/modules/catalog/index.js";
import type { Cart } from "@/modules/booking/carts/cart.schema.js";
import { settingService } from "@/modules/ops/index.js";

export type FulfillmentType = "scheduled" | "instant";

type CartLine = { productId: string };

export async function inferCartFulfillment(
    cart: Cart,
    items: CartLine[],
    cityId: string,
): Promise<FulfillmentType> {
    if (cart.fulfillmentType === "instant" || cart.fulfillmentType === "scheduled") {
        return cart.fulfillmentType;
    }
    if (!items.length) return "scheduled";

    let allInstantCapable = true;
    let anyInstant = false;
    for (const line of items) {
        const product = await getProductForCity(line.productId, cityId);
        if (!product.instantEnabled) allInstantCapable = false;
        if (product.instantEnabled) anyInstant = true;
    }
    if (allInstantCapable && anyInstant) return "instant";
    return "scheduled";
}

export async function assertInstantMarketplaceAllowed(): Promise<void> {
    const policy = await settingService.getInstantMarketplacePolicy();
    if (!policy.enabled) {
        throw ApiError.badRequest("instant booking is not available right now");
    }
}

export async function instantScheduledAt(): Promise<Date> {
    const dispatch = await settingService.getInstantDispatchPolicy();
    return new Date(Date.now() + dispatch.instantSlaMinutes * 60_000);
}
