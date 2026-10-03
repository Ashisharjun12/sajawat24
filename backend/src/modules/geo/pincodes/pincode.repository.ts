import { and, count, desc, eq, like, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { cities, type City } from "@/modules/geo/cities/city.schema.js";
import { pincodes, type NewPincode, type Pincode } from "@/modules/geo/pincodes/pincode.schema.js";

export type PincodePatch = Partial<Pick<Pincode, "cityId" | "locality" | "isServiceable">>;

export type PincodeListFilter = {
    cityId?: string;
    q?: string;
    isServiceable?: boolean;
};

export type PincodeWithCity = {
    pincode: Pincode;
    city: City;
};

export interface IPincodeRepository {
    findById(id: string): Promise<Pincode | undefined>;
    findByCode(code: string): Promise<Pincode | undefined>;
    findByCodeWithCity(code: string): Promise<PincodeWithCity | undefined>;
    list(
        pagination: PaginationQuery,
        filter?: PincodeListFilter,
    ): Promise<{ items: Pincode[]; total: number }>;
    insert(data: NewPincode): Promise<Pincode>;
    update(id: string, data: PincodePatch): Promise<Pincode | undefined>;
}

function pincodeListWhere(filter: PincodeListFilter = {}): SQL | undefined {
    const conditions: SQL[] = [];
    if (filter.cityId) {
        conditions.push(eq(pincodes.cityId, filter.cityId));
    }
    const digits = filter.q?.replace(/\D/g, "") ?? "";
    if (digits) {
        conditions.push(like(pincodes.code, `${digits}%`));
    }
    if (filter.isServiceable !== undefined) {
        conditions.push(eq(pincodes.isServiceable, filter.isServiceable));
    }
    return conditions.length ? and(...conditions) : undefined;
}

export class PincodeRepository implements IPincodeRepository {
    async findById(id: string): Promise<Pincode | undefined> {
        const [row] = await db.select().from(pincodes).where(eq(pincodes.id, id)).limit(1);
        return row;
    }

    async findByCode(code: string): Promise<Pincode | undefined> {
        const [row] = await db.select().from(pincodes).where(eq(pincodes.code, code)).limit(1);
        return row;
    }

    async findByCodeWithCity(code: string): Promise<PincodeWithCity | undefined> {
        const [row] = await db
            .select({ pincode: pincodes, city: cities })
            .from(pincodes)
            .innerJoin(cities, eq(pincodes.cityId, cities.id))
            .where(eq(pincodes.code, code))
            .limit(1);
        return row;
    }

    async list(
        pagination: PaginationQuery,
        filter: PincodeListFilter = {},
    ): Promise<{ items: Pincode[]; total: number }> {
        const where = pincodeListWhere(filter);
        const [totalRow] = await db.select({ value: count() }).from(pincodes).where(where);
        const items = await db
            .select()
            .from(pincodes)
            .where(where)
            .orderBy(desc(pincodes.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        return { items, total: Number(totalRow?.value ?? 0) };
    }

    async insert(data: NewPincode): Promise<Pincode> {
        const [row] = await db.insert(pincodes).values(data).returning();
        if (!row) {
            throw new Error("failed to create pincode");
        }
        return row;
    }

    async update(id: string, data: PincodePatch): Promise<Pincode | undefined> {
        const [row] = await db
            .update(pincodes)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(pincodes.id, id))
            .returning();
        return row;
    }
}
