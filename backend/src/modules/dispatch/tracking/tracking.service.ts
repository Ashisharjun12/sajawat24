import { ApiError } from "@/shared/errors/apiError.js";
import type { Order } from "@/modules/booking/orders/order.schema.js";
import { getBookingLocation } from "@/modules/dispatch/geo/vendor-geo.store.js";
import { haversineDistanceMeters } from "@/modules/dispatch/lib/haversine.js";
import { settingService } from "@/modules/ops/index.js";

export type PublicOrderTracking = {
    orderId: string;
    status: string;
    destination: { latitude: number; longitude: number } | null;
    vendor: {
        latitude: number | null;
        longitude: number | null;
        heading?: number;
        updatedAt: string | null;
        stale: boolean;
        distanceMeters?: number;
    } | null;
    liveTrackingEnabled: boolean;
    webMapEnabled: boolean;
};

const STALE_MS = 120_000;

export async function buildOrderTracking(order: Order): Promise<PublicOrderTracking> {
    const maps = await settingService.getInstantMapsPolicy();
    const liveTrackingEnabled = maps.liveTrackingEnabled;
    const webMapEnabled = maps.webMapEnabled;

    const destination =
        order.deliveryLatitude !== null &&
        order.deliveryLongitude !== null &&
        order.deliveryLatitude !== undefined &&
        order.deliveryLongitude !== undefined
            ? { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }
            : null;

    let vendorBlock: PublicOrderTracking["vendor"] = null;
    if (liveTrackingEnabled && ["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(order.status)) {
        const loc = await getBookingLocation(order.id);
        if (loc) {
            const age = Date.now() - new Date(loc.at).getTime();
            const stale = age > STALE_MS;
            let distanceMeters: number | undefined;
            if (destination && !stale) {
                distanceMeters = Math.round(
                    haversineDistanceMeters(
                        destination.latitude,
                        destination.longitude,
                        loc.latitude,
                        loc.longitude,
                    ),
                );
            }
            vendorBlock = {
                latitude: loc.latitude,
                longitude: loc.longitude,
                heading: loc.heading,
                updatedAt: loc.at,
                stale,
                distanceMeters,
            };
        } else {
            vendorBlock = {
                latitude: null,
                longitude: null,
                updatedAt: null,
                stale: true,
            };
        }
    }

    return {
        orderId: order.id,
        status: order.status,
        destination,
        vendor: vendorBlock,
        liveTrackingEnabled,
        webMapEnabled,
    };
}

export function assertCanPostLocation(order: Order): void {
    if (!["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(order.status)) {
        throw ApiError.conflict("location can only be posted for active trips");
    }
}
