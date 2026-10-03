import DbFactory from "@/infrastructure/database/db.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { Order } from "@/modules/booking/orders/order.schema.js";
import { getBookingLocation } from "@/modules/dispatch/geo/vendor-geo.store.js";
import { getMapsService } from "@/modules/maps/maps.service.js";
import type { RouteResult } from "@/modules/maps/maps.types.js";
import { settingService } from "@/modules/ops/index.js";

const ROUTE_CACHE_TTL_SEC = 120;
const ROUTE_CACHE_TTL_EN_ROUTE_SEC = 45;
const TRIP_STATUSES = new Set(["ASSIGNED", "EN_ROUTE", "ON_SITE"]);
const TRIP_FULFILLMENT = new Set(["instant", "scheduled"]);

function routeCacheKey(orderId: string, lat: number, lng: number, enRoute: boolean): string {
    const precision = enRoute ? 10000 : 1000;
    const rLat = Math.round(lat * precision) / precision;
    const rLng = Math.round(lng * precision) / precision;
    return `route:${orderId}:${rLat}:${rLng}`;
}

export async function buildOrderTripRoute(order: Order): Promise<RouteResult> {
    if (!TRIP_FULFILLMENT.has(order.fulfillmentType)) {
        throw ApiError.badRequest("route is not available for this fulfillment type");
    }
    if (!TRIP_STATUSES.has(order.status)) {
        throw ApiError.conflict("route is not available for this order status");
    }

    const mapsPolicy = await settingService.getInstantMapsPolicy();
    if (!mapsPolicy.liveTrackingEnabled) {
        throw ApiError.forbidden("live tracking is disabled");
    }

    const destLat = order.deliveryLatitude;
    const destLng = order.deliveryLongitude;
    if (destLat == null || destLng == null) {
        throw ApiError.badRequest("order has no delivery coordinates");
    }

    const vendorLoc = await getBookingLocation(order.id);
    if (!vendorLoc) {
        throw ApiError.conflict("vendor location not available yet");
    }

    const enRoute = order.status === "EN_ROUTE";
    const redis = DbFactory.getRedisDatabase().getClient();
    const cacheKey = routeCacheKey(order.id, vendorLoc.latitude, vendorLoc.longitude, enRoute);
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached) as RouteResult;
    }

    const route = await getMapsService().computeRoute(
        { latitude: vendorLoc.latitude, longitude: vendorLoc.longitude },
        { latitude: destLat, longitude: destLng },
    );

    const ttl = enRoute ? ROUTE_CACHE_TTL_EN_ROUTE_SEC : ROUTE_CACHE_TTL_SEC;
    await redis.setex(cacheKey, ttl, JSON.stringify(route));
    return route;
}

/** @deprecated Use buildOrderTripRoute */
export async function buildInstantOrderRoute(order: Order): Promise<RouteResult> {
    return buildOrderTripRoute(order);
}
