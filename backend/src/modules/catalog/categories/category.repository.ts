import { and, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { categories, type Category, type NewCategory } from "@/modules/catalog/categories/category.schema.js";

export type CategoryPatch = Partial<
    Pick<Category, "name" | "slug" | "parentId" | "imageUploadId" | "iconKey" | "iconTone" | "isActive">
>;

export type CategoryListFilter = {
    q?: string;
    isActive?: boolean;
    parentId?: string | null;
};

export interface ICategoryRepository {
    findById(id: string): Promise<Category | undefined>;
    listActive(): Promise<Category[]>;
    list(
        pagination: PaginationQuery,
        filter?: CategoryListFilter,
    ): Promise<{ items: Category[]; total: number }>;
    insert(data: NewCategory): Promise<Category>;
    update(id: string, data: CategoryPatch): Promise<Category | undefined>;
}

function categoryListWhere(filter: CategoryListFilter = {}): SQL | undefined {
    const conditions: SQL[] = [];
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        const match = or(ilike(categories.name, pattern), ilike(categories.slug, pattern));
        if (match) conditions.push(match);
    }
    if (filter.isActive !== undefined) {
        conditions.push(eq(categories.isActive, filter.isActive));
    }
    if (filter.parentId === null) {
        conditions.push(isNull(categories.parentId));
    } else if (filter.parentId) {
        conditions.push(eq(categories.parentId, filter.parentId));
    }
    return conditions.length ? and(...conditions) : undefined;
}

export class CategoryRepository implements ICategoryRepository {
    async findById(id: string): Promise<Category | undefined> {
        const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
        return row;
    }

    async listActive(): Promise<Category[]> {
        return db
            .select()
            .from(categories)
            .where(eq(categories.isActive, true))
            .orderBy(categories.name);
    }

    async list(
        pagination: PaginationQuery,
        filter: CategoryListFilter = {},
    ): Promise<{ items: Category[]; total: number }> {
        const where = categoryListWhere(filter);
        const [totalRow] = await db.select({ value: count() }).from(categories).where(where);
        const items = await db
            .select()
            .from(categories)
            .where(where)
            .orderBy(desc(categories.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        return { items, total: Number(totalRow?.value ?? 0) };
    }

    async insert(data: NewCategory): Promise<Category> {
        const [row] = await db.insert(categories).values(data).returning();
        if (!row) {
            throw new Error("failed to create category");
        }
        return row;
    }

    async update(id: string, data: CategoryPatch): Promise<Category | undefined> {
        const [row] = await db
            .update(categories)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(categories.id, id))
            .returning();
        return row;
    }
}
