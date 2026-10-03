import { ApiError } from "@/shared/errors/apiError.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import {
    geoAddVendorOnline,
    geoRemoveVendorOnline,
    touchVendorHeartbeat,
} from "@/modules/dispatch/geo/vendor-geo.store.js";
import { settingService } from "@/modules/ops/index.js";

export type VendorPresenceInput = {
    latitude: number;
    longitude: number;
    onDuty?: boolean;
};

export class VendorPresenceService {
    constructor(private readonly vendors: IVendorRepository) {}

    async updatePresence(userId: string, input: VendorPresenceInput): Promise<{ onDuty: boolean }> {
        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor) throw ApiError.notFound("vendor not found");

        const dispatch = await settingService.getInstantDispatchPolicy();
        if (!dispatch.enabled) {
            throw ApiError.conflict("instant dispatch is disabled");
        }

        const onDuty = input.onDuty ?? vendor.isOnDuty;
        if (!onDuty) {
            if (vendor.cityId) {
                await geoRemoveVendorOnline(vendor.cityId, vendor.id);
            }
            return { onDuty: false };
        }

        if (!vendor.cityId) {
            throw ApiError.badRequest("vendor city is required for presence");
        }

        const lat = input.latitude;
        const lng = input.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw ApiError.badRequest("invalid coordinates");
        }

        await geoAddVendorOnline(vendor.cityId, vendor.id, lng, lat);
        await touchVendorHeartbeat(vendor.id, vendor.cityId);
        return { onDuty: true };
    }

    async heartbeat(userId: string): Promise<void> {
        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor?.isOnDuty || !vendor.cityId) return;
        await touchVendorHeartbeat(vendor.id, vendor.cityId);
    }
}
