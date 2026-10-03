import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { haversineDistanceMeters } from "@/modules/dispatch/lib/haversine.js";
import { geoSearchNearby } from "@/modules/dispatch/geo/vendor-geo.store.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { assignments } from "@/modules/assignment/assignments/assignment.schema.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { settingService } from "@/modules/ops/index.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { isOrderCustomerConflictWithVendor } from "@/modules/identity/consumer/self-dealing.js";

const ACTIVE_TRIP = ["ASSIGNED", "EN_ROUTE", "ON_SITE"] as const;

export type DispatchCandidate = {
    vendorId: string;
    distanceMeters: number;
    lastOfferedAt: Date | null;
};

export async function listDispatchCandidates(input: {
    orderId: string;
    cityId: string;
    deliveryPincode: string;
    customerLat: number | null;
    customerLng: number | null;
    radiusKm: number;
    excludeVendorIds: string[];
    geoCount: number;
}): Promise<DispatchCandidate[]> {
    const policy = await settingService.getPayoutPolicy();
    const codMax = policy.codMaxDuePaise;

    const [orderRow] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
    const isCod = orderRow?.paymentMethod === "COD";
    const orderUserId = orderRow?.userId;
    const vendorRepo = new VendorRepository();
    const memberRepo = new VendorMemberRepository();

    const busyRows = await db
        .select({ vendorId: assignments.vendorId })
        .from(assignments)
        .innerJoin(orders, eq(assignments.orderId, orders.id))
        .where(
            and(
                inArray(orders.status, [...ACTIVE_TRIP]),
                sql`${assignments.supersededAt} IS NULL`,
                inArray(assignments.vendorResponse, ["pending", "accepted"]),
            ),
        );
    const busyVendorIds = new Set(busyRows.map((r) => r.vendorId));

    const geoHits =
        input.customerLat !== null && input.customerLng !== null
            ? await geoSearchNearby(
                  input.cityId,
                  input.customerLng,
                  input.customerLat,
                  input.radiusKm,
                  input.geoCount,
              ).catch(() => [])
            : [];

    const geoRank = new Map(geoHits.map((h, i) => [h.vendorId, { distanceMeters: h.distanceMeters, rank: i }]));

    const vendorRows = await db
        .select({
            id: vendors.id,
            pincode: vendors.pincode,
            isOnDuty: vendors.isOnDuty,
            baseLatitude: vendors.baseLatitude,
            baseLongitude: vendors.baseLongitude,
            lastOfferedAt: vendors.lastOfferedAt,
        })
        .from(vendors)
        .where(
            and(eq(vendors.cityId, input.cityId), eq(vendors.onboardingStatus, "ACTIVE"), eq(vendors.isOnDuty, true)),
        );

    const candidates: DispatchCandidate[] = [];

    for (const row of vendorRows) {
        if (input.excludeVendorIds.includes(row.id)) continue;
        if (busyVendorIds.has(row.id)) continue;
        if (
            orderUserId &&
            (await isOrderCustomerConflictWithVendor(orderUserId, row.id, {
                vendors: vendorRepo,
                members: memberRepo,
            }))
        ) {
            continue;
        }
        if (isCod) {
            const codDue = await ledgerService.getVendorCodDue(row.id);
            if (codDue > codMax) continue;
        }

        let distanceMeters: number;
        if (geoRank.has(row.id)) {
            distanceMeters = geoRank.get(row.id)!.distanceMeters;
        } else if (
            input.customerLat !== null &&
            input.customerLng !== null &&
            row.baseLatitude !== null &&
            row.baseLongitude !== null
        ) {
            distanceMeters = Math.round(
                haversineDistanceMeters(
                    input.customerLat,
                    input.customerLng,
                    row.baseLatitude,
                    row.baseLongitude,
                ),
            );
            if (distanceMeters > input.radiusKm * 1000) continue;
        } else if (row.pincode === input.deliveryPincode) {
            distanceMeters = 0;
        } else {
            distanceMeters = 50_000;
        }

        candidates.push({
            vendorId: row.id,
            distanceMeters,
            lastOfferedAt: row.lastOfferedAt,
        });
    }

    candidates.sort((a, b) => {
        if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
        const aT = a.lastOfferedAt?.getTime() ?? 0;
        const bT = b.lastOfferedAt?.getTime() ?? 0;
        if (aT !== bT) return aT - bT;
        return a.vendorId.localeCompare(b.vendorId);
    });

    return candidates;
}
