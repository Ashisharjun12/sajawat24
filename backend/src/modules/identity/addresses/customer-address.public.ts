import type { CustomerAddress } from "@/modules/identity/addresses/customer-address.schema.js";

export type PublicCustomerAddress = {
    id: string;
    label: string;
    address: string;
    landmark: string | null;
    pincode: string;
    cityId: string | null;
    cityName: string;
    isDefault: boolean;
    latitude: number | null;
    longitude: number | null;
    geoSource: string | null;
};

export function toPublicCustomerAddress(row: CustomerAddress): PublicCustomerAddress {
    return {
        id: row.id,
        label: row.label,
        address: row.addressLine,
        landmark: row.landmark,
        pincode: row.pincode,
        cityId: row.cityId,
        cityName: row.cityName,
        isDefault: row.isDefault,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        geoSource: row.geoSource ?? null,
    };
}
