import { ApiError } from "@/shared/errors/apiError.js";
import { assertDeliveryLocation } from "@/modules/geo/index.js";
import type {
    CreateCustomerAddressInput,
    PatchCustomerAddressInput,
} from "@/modules/identity/addresses/customer-address.dto.js";
import {
    toPublicCustomerAddress,
    type PublicCustomerAddress,
} from "@/modules/identity/addresses/customer-address.public.js";
import { CustomerAddressRepository } from "@/modules/identity/addresses/customer-address.repository.js";

export class CustomerAddressService {
    constructor(private readonly addresses = new CustomerAddressRepository()) {}

    async list(userId: string): Promise<PublicCustomerAddress[]> {
        const rows = await this.addresses.listByUser(userId);
        return rows.map(toPublicCustomerAddress);
    }

    async create(userId: string, input: CreateCustomerAddressInput): Promise<PublicCustomerAddress> {
        const resolved = await this.resolvePin(input.pincode, input.cityId);
        const existing = await this.addresses.listByUser(userId);
        const shouldDefault = input.setDefault ?? existing.length === 0;
        if (shouldDefault) {
            await this.addresses.clearDefaultForUser(userId);
        }

        const row = await this.addresses.insert({
            userId,
            label: input.label,
            addressLine: input.address,
            landmark: input.landmark?.trim() || null,
            pincode: input.pincode,
            cityId: resolved.cityId,
            cityName: input.cityName?.trim() || resolved.cityName,
            isDefault: shouldDefault,
            latitude: input.latitude,
            longitude: input.longitude,
            geoSource: input.geoSource ?? "geocode_manual",
        });

        return toPublicCustomerAddress(row);
    }

    async patch(
        userId: string,
        id: string,
        input: PatchCustomerAddressInput,
    ): Promise<PublicCustomerAddress> {
        const current = await this.addresses.findByIdForUser(id, userId);
        if (!current) {
            throw ApiError.notFound("address not found");
        }

        const pincode = input.pincode ?? current.pincode;
        const cityId = input.cityId === null ? null : (input.cityId ?? current.cityId);
        const resolved = await this.resolvePin(pincode, cityId ?? undefined);

        if (input.setDefault) {
            await this.addresses.clearDefaultForUser(userId);
        }

        const geoPatch =
            input.latitude !== undefined && input.longitude !== undefined
                ? {
                      latitude: input.latitude,
                      longitude: input.longitude,
                      geoSource: input.geoSource ?? "geocode_manual",
                  }
                : {};

        const row = await this.addresses.update(id, userId, {
            label: input.label,
            addressLine: input.address,
            landmark: input.landmark === null ? null : input.landmark,
            pincode: input.pincode,
            cityId: resolved.cityId,
            cityName: input.cityName ?? (input.pincode ? resolved.cityName : undefined),
            isDefault: input.setDefault,
            ...geoPatch,
        });

        if (!row) {
            throw ApiError.notFound("address not found");
        }
        return toPublicCustomerAddress(row);
    }

    async remove(userId: string, id: string): Promise<void> {
        const current = await this.addresses.findByIdForUser(id, userId);
        if (!current) {
            throw ApiError.notFound("address not found");
        }
        const wasDefault = current.isDefault;
        const deleted = await this.addresses.delete(id, userId);
        if (!deleted) {
            throw ApiError.notFound("address not found");
        }
        if (wasDefault) {
            const remaining = await this.addresses.listByUser(userId);
            if (remaining[0]) {
                await this.addresses.update(remaining[0].id, userId, { isDefault: true });
            }
        }
    }

    async setDefault(userId: string, id: string): Promise<PublicCustomerAddress> {
        const current = await this.addresses.findByIdForUser(id, userId);
        if (!current) {
            throw ApiError.notFound("address not found");
        }
        await this.addresses.clearDefaultForUser(userId);
        const row = await this.addresses.update(id, userId, { isDefault: true });
        if (!row) {
            throw ApiError.notFound("address not found");
        }
        return toPublicCustomerAddress(row);
    }

    private async resolvePin(
        pincode: string,
        cityId?: string,
    ): Promise<{ cityId: string; cityName: string }> {
        if (!cityId) {
            throw ApiError.badRequest("cityId is required");
        }
        const resolved = await assertDeliveryLocation({ cityId, pincode });
        return { cityId: resolved.city.id, cityName: resolved.city.name };
    }
}
