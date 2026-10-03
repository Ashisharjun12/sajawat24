import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";
import { displayUrl } from "@/modules/upload/media/media.public.js";
import type {
    AdminVendorDetail,
    AdminVendorListItem,
    PublicVendorProfile,
} from "@/modules/identity/vendors/vendor.public.js";
import { users, type User } from "@/modules/identity/users/user.schema.js";
import type { GeoPointSource } from "@/modules/booking/domain/geo-enums.js";
import {
    vendors,
    type NewVendor,
    type Vendor,
    type VendorOnboardingStatus,
} from "@/modules/identity/vendors/vendor.schema.js";

export type CreateVendorWithUserInput = {
    phone: string;
    name: string;
    email: string;
    altPhone?: string;
    cityId: string;
    shopAddress: string;
    pincode: string;
    shopImageUploadId?: string;
    baseLatitude?: number | null;
    baseLongitude?: number | null;
    baseGeoSource?: GeoPointSource | null;
};

export type AssignCandidate = {
    id: string;
    name: string;
    phone: string | null;
    pincode: string;
    cityName: string;
    rank: "same_pin" | "same_city";
    assignable: boolean;
    assignmentStatus?: "current" | "declined";
    dutyStatus: "online" | "offline";
};

export interface IVendorRepository {
    findById(id: string): Promise<Vendor | undefined>;
    findByUserId(userId: string): Promise<Vendor | undefined>;
    findPublicProfileByUserId(userId: string): Promise<PublicVendorProfile | undefined>;
    create(data: NewVendor): Promise<Vendor>;
    createWithUser(input: CreateVendorWithUserInput): Promise<User>;
    listAdmin(input: {
        page: number;
        limit: number;
        status?: VendorOnboardingStatus;
        search?: string;
        cityId?: string;
        isOnDuty?: boolean;
        joinedFrom?: Date;
        joinedTo?: Date;
    }): Promise<{ items: AdminVendorListItem[]; total: number }>;
    listAssignCandidates(input: {
        cityId: string;
        deliveryPincode: string;
        search?: string;
        samePin?: boolean;
        currentVendorId?: string | null;
        currentVendorResponse?: "pending" | "accepted" | "declined" | null;
        declinedVendorId?: string | null;
    }): Promise<{ items: AssignCandidate[]; total: number }>;
    findAdminDetail(id: string): Promise<AdminVendorDetail | undefined>;
    updateOnboardingStatus(id: string, status: VendorOnboardingStatus): Promise<Vendor | undefined>;
    updateDuty(id: string, isOnDuty: boolean): Promise<Vendor | undefined>;
    updateProfile(
        id: string,
        input: {
            cityId: string;
            shopAddress: string;
            pincode: string;
            altPhone?: string | null;
            shopImageUploadId?: string | null;
            baseLatitude?: number | null;
            baseLongitude?: number | null;
            baseGeoSource?: GeoPointSource | null;
            onboardingStatus: VendorOnboardingStatus;
        },
    ): Promise<Vendor | undefined>;
}

function shopImageUrl(upload: typeof uploads.$inferSelect | null | undefined): string | null {
    if (!upload) return null;
    return displayUrl(upload);
}

export class VendorRepository implements IVendorRepository {
    async findById(id: string): Promise<Vendor | undefined> {
        const [row] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
        return row;
    }

    async findByUserId(userId: string): Promise<Vendor | undefined> {
        const [row] = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
        return row;
    }

    async findPublicProfileByUserId(userId: string): Promise<PublicVendorProfile | undefined> {
        const [row] = await db
            .select({
                vendor: vendors,
                cityName: cities.name,
                state: cities.state,
                upload: uploads,
            })
            .from(vendors)
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .leftJoin(uploads, eq(vendors.shopImageUploadId, uploads.id))
            .where(eq(vendors.userId, userId))
            .limit(1);

        if (!row) return undefined;

        return {
            id: row.vendor.id,
            cityId: row.vendor.cityId,
            cityName: row.cityName,
            state: row.state,
            shopAddress: row.vendor.shopAddress,
            pincode: row.vendor.pincode,
            altPhone: row.vendor.altPhone,
            shopImageUrl: shopImageUrl(row.upload),
            onboardingStatus: row.vendor.onboardingStatus,
            isOnDuty: row.vendor.isOnDuty,
            dutyChangedAt: row.vendor.dutyChangedAt?.toISOString() ?? null,
        };
    }

    async create(data: NewVendor): Promise<Vendor> {
        const [row] = await db.insert(vendors).values(data).returning();
        return row;
    }

    async createWithUser(input: CreateVendorWithUserInput): Promise<User> {
        return db.transaction(async (tx) => {
            const [user] = await tx
                .insert(users)
                .values({
                    phone: input.phone,
                    email: input.email.trim().toLowerCase(),
                    name: input.name.trim(),
                    role: "vendor",
                    phoneVerifiedAt: new Date(),
                })
                .returning();
            if (!user) {
                throw new Error("failed to create vendor user");
            }
            await tx.insert(vendors).values({
                userId: user.id,
                cityId: input.cityId,
                shopAddress: input.shopAddress.trim(),
                pincode: input.pincode,
                altPhone: input.altPhone ?? null,
                shopImageUploadId: input.shopImageUploadId ?? null,
                baseLatitude: input.baseLatitude ?? null,
                baseLongitude: input.baseLongitude ?? null,
                baseGeoSource: input.baseGeoSource ?? null,
            });
            return user;
        });
    }

    async listAdmin(input: {
        page: number;
        limit: number;
        status?: VendorOnboardingStatus;
        search?: string;
        cityId?: string;
        isOnDuty?: boolean;
        joinedFrom?: Date;
        joinedTo?: Date;
    }): Promise<{ items: AdminVendorListItem[]; total: number }> {
        const offset = (input.page - 1) * input.limit;
        const filters = [];

        if (input.status) {
            filters.push(eq(vendors.onboardingStatus, input.status));
        }

        if (input.cityId) {
            filters.push(eq(vendors.cityId, input.cityId));
        }

        if (input.isOnDuty !== undefined) {
            filters.push(eq(vendors.isOnDuty, input.isOnDuty));
        }

        if (input.joinedFrom) {
            filters.push(gte(vendors.createdAt, input.joinedFrom));
        }

        if (input.joinedTo) {
            filters.push(lte(vendors.createdAt, input.joinedTo));
        }

        if (input.search) {
            const pattern = `%${input.search}%`;
            filters.push(
                or(
                    ilike(users.name, pattern),
                    ilike(users.phone, pattern),
                    ilike(users.email, pattern),
                    ilike(cities.name, pattern),
                )!,
            );
        }

        const whereClause = filters.length ? and(...filters) : undefined;

        const [totalRow] = await db
            .select({ total: count() })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .where(whereClause);

        const rows = await db
            .select({
                id: vendors.id,
                name: users.name,
                phone: users.phone,
                email: users.email,
                cityName: cities.name,
                state: cities.state,
                onboardingStatus: vendors.onboardingStatus,
                isOnDuty: vendors.isOnDuty,
                dutyChangedAt: vendors.dutyChangedAt,
                createdAt: vendors.createdAt,
            })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .where(whereClause)
            .orderBy(desc(vendors.createdAt))
            .limit(input.limit)
            .offset(offset);

        return {
            items: rows,
            total: Number(totalRow?.total ?? 0),
        };
    }

    async listAssignCandidates(input: {
        cityId: string;
        deliveryPincode: string;
        search?: string;
        samePin?: boolean;
        currentVendorId?: string | null;
        currentVendorResponse?: "pending" | "accepted" | "declined" | null;
        declinedVendorId?: string | null;
    }): Promise<{ items: AssignCandidate[]; total: number }> {
        const filters = [
            eq(vendors.cityId, input.cityId),
            eq(vendors.onboardingStatus, "ACTIVE"),
        ];

        if (input.samePin) {
            filters.push(eq(vendors.pincode, input.deliveryPincode));
        }

        if (input.search) {
            const pattern = `%${input.search}%`;
            filters.push(
                or(
                    ilike(users.name, pattern),
                    ilike(users.phone, pattern),
                    ilike(users.email, pattern),
                )!,
            );
        }

        const whereClause = and(...filters);
        const rows = await db
            .select({
                id: vendors.id,
                name: users.name,
                phone: users.phone,
                pincode: vendors.pincode,
                cityName: cities.name,
                isOnDuty: vendors.isOnDuty,
            })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .where(whereClause)
            .orderBy(
                sql`CASE WHEN ${vendors.pincode} = ${input.deliveryPincode} THEN 0 ELSE 1 END`,
                users.name,
            );

        const items: AssignCandidate[] = rows.map((row) => {
            const isCurrent =
                input.currentVendorId === row.id &&
                (input.currentVendorResponse === "pending" ||
                    input.currentVendorResponse === "accepted");
            const wasDeclined = input.declinedVendorId === row.id;

            return {
                id: row.id,
                name: row.name,
                phone: row.phone,
                pincode: row.pincode,
                cityName: row.cityName,
                rank: row.pincode === input.deliveryPincode ? "same_pin" : "same_city",
                assignable: !isCurrent && row.isOnDuty,
                assignmentStatus: isCurrent ? "current" : wasDeclined ? "declined" : undefined,
                dutyStatus: row.isOnDuty ? "online" : "offline",
            };
        });

        return { items, total: items.length };
    }

    async findAdminDetail(id: string): Promise<AdminVendorDetail | undefined> {
        const [row] = await db
            .select({
                id: vendors.id,
                userId: vendors.userId,
                name: users.name,
                phone: users.phone,
                email: users.email,
                altPhone: vendors.altPhone,
                cityName: cities.name,
                state: cities.state,
                shopAddress: vendors.shopAddress,
                pincode: vendors.pincode,
                onboardingStatus: vendors.onboardingStatus,
                isOnDuty: vendors.isOnDuty,
                dutyChangedAt: vendors.dutyChangedAt,
                createdAt: vendors.createdAt,
                upload: uploads,
            })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .leftJoin(uploads, eq(vendors.shopImageUploadId, uploads.id))
            .where(eq(vendors.id, id))
            .limit(1);

        if (!row) return undefined;

        return {
            id: row.id,
            userId: row.userId,
            name: row.name,
            phone: row.phone,
            email: row.email,
            altPhone: row.altPhone,
            cityName: row.cityName,
            state: row.state,
            shopAddress: row.shopAddress,
            pincode: row.pincode,
            shopImageUrl: shopImageUrl(row.upload),
            onboardingStatus: row.onboardingStatus,
            isOnDuty: row.isOnDuty,
            dutyChangedAt: row.dutyChangedAt,
            createdAt: row.createdAt,
        };
    }

    async updateOnboardingStatus(
        id: string,
        status: VendorOnboardingStatus,
    ): Promise<Vendor | undefined> {
        const isOnDuty = status === "ACTIVE";
        const [row] = await db
            .update(vendors)
            .set({
                onboardingStatus: status,
                isOnDuty,
                dutyChangedAt: sql`now()`,
                updatedAt: sql`now()`,
            })
            .where(eq(vendors.id, id))
            .returning();
        return row;
    }

    async updateDuty(id: string, isOnDuty: boolean): Promise<Vendor | undefined> {
        const [row] = await db
            .update(vendors)
            .set({
                isOnDuty,
                dutyChangedAt: sql`now()`,
                updatedAt: sql`now()`,
            })
            .where(eq(vendors.id, id))
            .returning();
        return row;
    }

    async updateProfile(
        id: string,
        input: {
            cityId: string;
            shopAddress: string;
            pincode: string;
            altPhone?: string | null;
            shopImageUploadId?: string | null;
            baseLatitude?: number | null;
            baseLongitude?: number | null;
            baseGeoSource?: GeoPointSource | null;
            onboardingStatus: VendorOnboardingStatus;
        },
    ): Promise<Vendor | undefined> {
        const [row] = await db
            .update(vendors)
            .set({
                cityId: input.cityId,
                shopAddress: input.shopAddress.trim(),
                pincode: input.pincode,
                altPhone: input.altPhone ?? null,
                shopImageUploadId: input.shopImageUploadId ?? null,
                baseLatitude: input.baseLatitude ?? null,
                baseLongitude: input.baseLongitude ?? null,
                baseGeoSource: input.baseGeoSource ?? null,
                onboardingStatus: input.onboardingStatus,
                isOnDuty: false,
                dutyChangedAt: sql`now()`,
                updatedAt: sql`now()`,
            })
            .where(eq(vendors.id, id))
            .returning();
        return row;
    }
}
