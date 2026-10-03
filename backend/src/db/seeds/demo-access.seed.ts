import { and, eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { pincodes } from "@/modules/geo/pincodes/pincode.schema.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";
import { getDemoAuthCredentials } from "@/modules/ops/settings/demo-auth-credentials.js";

export type DemoAccessSeedResult = {
    customerUserId: string;
    vendorUserId: string;
    vendorId: string;
    staffUserId: string;
    cityName: string;
    credentials: ReturnType<typeof getDemoAuthCredentials>;
};

async function ensureCityPincode(cityId: string, cityName: string): Promise<string> {
    const [existing] = await db.select().from(pincodes).where(eq(pincodes.cityId, cityId)).limit(1);
    if (existing) {
        return existing.code;
    }

    const preferred = process.env.DEMO_VENDOR_PINCODE?.trim() || "900099";
    const [taken] = await db.select().from(pincodes).where(eq(pincodes.code, preferred)).limit(1);
    if (taken && taken.cityId !== cityId) {
        throw new Error(
            `Pincode ${preferred} is already used for another city. Set DEMO_VENDOR_PINCODE or DEMO_VENDOR_CITY_ID, or add a pincode for ${cityName} in admin.`,
        );
    }
    if (!taken) {
        await db.insert(pincodes).values({
            code: preferred,
            cityId,
            isServiceable: true,
            locality: "Play review (demo seed)",
        });
    }
    return preferred;
}

async function resolveCityId(): Promise<{ cityId: string; cityName: string; pincode: string }> {
    const envCityId = process.env.DEMO_VENDOR_CITY_ID?.trim();
    if (envCityId) {
        const [city] = await db.select().from(cities).where(eq(cities.id, envCityId)).limit(1);
        if (!city) {
            throw new Error(`DEMO_VENDOR_CITY_ID not found: ${envCityId}`);
        }
        const pincode = await ensureCityPincode(city.id, city.name);
        return { cityId: city.id, cityName: city.name, pincode };
    }

    const [row] = await db
        .select({
            cityId: cities.id,
            cityName: cities.name,
            pincode: pincodes.code,
        })
        .from(cities)
        .innerJoin(pincodes, eq(pincodes.cityId, cities.id))
        .where(and(eq(cities.isActive, true), eq(pincodes.isServiceable, true)))
        .limit(1);

    if (row) {
        return { cityId: row.cityId, cityName: row.cityName, pincode: row.pincode };
    }

    const [city] = await db.select().from(cities).where(eq(cities.isActive, true)).limit(1);
    if (!city) {
        throw new Error("No active city in database. Create a city in admin before seeding demo access.");
    }

    const pincode = await ensureCityPincode(city.id, city.name);
    return { cityId: city.id, cityName: city.name, pincode };
}

export async function seedDemoAccess(): Promise<DemoAccessSeedResult> {
    const credentials = getDemoAuthCredentials();
    const users = new UserRepository();
    const vendors = new VendorRepository();
    const members = new VendorMemberRepository();
    const { cityId, cityName, pincode } = await resolveCityId();

    let customer = await users.findByPhone(credentials.customerPhone);
    if (!customer) {
        customer = await users.create({
            phone: credentials.customerPhone,
            name: "Play Review Customer",
            role: "user",
            phoneVerifiedAt: new Date(),
        });
    }

    let vendorUser = await users.findByPhone(credentials.vendorOwnerPhone);
    if (!vendorUser) {
        vendorUser = await vendors.createWithUser({
            phone: credentials.vendorOwnerPhone,
            name: "Play Review Vendor",
            email: "demo-vendor@decoryy.internal",
            cityId,
            shopAddress: "Demo Decor Shop, Play Review Lane",
            pincode,
        });
    } else if (vendorUser.role !== "vendor") {
        throw new Error(
            `Demo vendor phone ${credentials.vendorOwnerPhone} is already used by a non-vendor account`,
        );
    }

    const vendor = await vendors.findByUserId(vendorUser.id);
    if (!vendor) {
        throw new Error("Demo vendor user exists but has no vendor profile");
    }
    await vendors.updateOnboardingStatus(vendor.id, "ACTIVE");
    await members.upsertOwnerForVendor({
        vendorId: vendor.id,
        userId: vendorUser.id,
        invitedPhone: credentials.vendorOwnerPhone,
        displayName: vendorUser.name,
    });

    let staffUser = await users.findByPhone(credentials.vendorStaffPhone);
    if (!staffUser) {
        staffUser = await users.create({
            phone: credentials.vendorStaffPhone,
            name: "Play Review Staff",
            role: "vendor_staff",
            phoneVerifiedAt: new Date(),
        });
    } else if (staffUser.role === "user") {
        staffUser = await users.updateRole(staffUser.id, "vendor_staff");
    } else if (staffUser.role !== "vendor_staff") {
        throw new Error(
            `Demo staff phone ${credentials.vendorStaffPhone} is already used by another account type`,
        );
    }

    const team = await members.listForVendor(vendor.id);
    const existingStaff = team.find(
        (row) => row.invitedPhone === credentials.vendorStaffPhone && row.kind === "WORKER",
    );
    if (!existingStaff) {
        await members.create({
            vendorId: vendor.id,
            invitedPhone: credentials.vendorStaffPhone,
            displayName: staffUser.name,
            kind: "WORKER",
            status: "active",
            userId: staffUser.id,
        });
    } else if (!existingStaff.userId) {
        await members.update(existingStaff.id, { userId: staffUser.id, status: "active" });
    }

    return {
        customerUserId: customer.id,
        vendorUserId: vendorUser.id,
        vendorId: vendor.id,
        staffUserId: staffUser.id,
        cityName,
        credentials,
    };
}
