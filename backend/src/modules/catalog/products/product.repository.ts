import { and, asc, count, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import {
    productImages,
    products,
    type NewProduct,
    type Product,
    type ProductImage,
} from "@/modules/catalog/products/product.schema.js";
import { cityPrices } from "@/modules/catalog/pricing/city-price.schema.js";

export type ProductPatch = Partial<
    Pick<
        Product,
        | "name"
        | "slug"
        | "description"
        | "categoryId"
        | "isActive"
        | "scheduledEnabled"
        | "instantEnabled"
        | "instantShowBadge"
        | "instantBadgeLabel"
        | "instantPdpNote"
        | "instantEtaMinutes"
        | "paymentCod"
        | "paymentOnline"
        | "pricePaise"
        | "compareAtPaise"
        | "includes"
        | "deliverySetup"
        | "careInstructions"
        | "faqs"
    >
>;

export type ProductPriceFilter = "none" | "set" | "sale";

export type ProductListFilter = {
    q?: string;
    isActive?: boolean;
    categoryId?: string;
    cityId?: string;
    price?: ProductPriceFilter;
};

export type ProductListRow = Product & { categoryName: string };

export type PricedProduct = {
    product: Product;
    pricePaise: number;
};

export type PublicProductSort = "popularity" | "new" | "price_asc" | "price_desc";

export type PublicPricedFilter = {
    categoryIds?: string[];
    minPricePaise?: number;
    maxPricePaise?: number;
    sort?: PublicProductSort;
    q?: string;
    instantOnly?: boolean;
};

export type CategoryFacet = {
    id: string;
    name: string;
    count: number;
};

export type PriceFacet = {
    minPaise: number;
    maxPaise: number;
};

export interface IProductRepository {
    findById(id: string): Promise<Product | undefined>;
    list(
        pagination: PaginationQuery,
        filter?: ProductListFilter,
    ): Promise<{ items: ProductListRow[]; total: number }>;
    insert(data: NewProduct): Promise<Product>;
    update(id: string, data: ProductPatch): Promise<Product | undefined>;
    delete(id: string): Promise<boolean>;
    listImages(productId: string): Promise<ProductImage[]>;
    listImagesForProductIds(productIds: string[]): Promise<ProductImage[]>;
    replaceImages(productId: string, uploadIds: string[]): Promise<void>;
    listPricedForCity(cityId: string, filter?: { categoryId?: string }): Promise<PricedProduct[]>;
    listPricedForCityPage(
        cityId: string,
        filter: PublicPricedFilter,
        pagination: PaginationQuery,
    ): Promise<{ items: PricedProduct[]; total: number }>;
    listCategoryFacets(
        cityId: string,
        filter?: Pick<PublicPricedFilter, "minPricePaise" | "maxPricePaise">,
    ): Promise<CategoryFacet[]>;
    priceRangeForCity(
        cityId: string,
        filter?: Pick<PublicPricedFilter, "categoryIds">,
    ): Promise<PriceFacet>;
    findByIds(ids: string[]): Promise<Product[]>;
    listPricedByIds(cityId: string, ids: string[]): Promise<PricedProduct[]>;
}

function sellPriceSql() {
    return sql`coalesce(${cityPrices.pricePaise}, ${products.pricePaise})`;
}

function orderByForPublicSort(sort: PublicProductSort = "popularity") {
    switch (sort) {
        case "new":
            return [desc(products.createdAt), asc(products.name)];
        case "price_asc":
            return [asc(sellPriceSql()), asc(products.name)];
        case "price_desc":
            return [desc(sellPriceSql()), asc(products.name)];
        case "popularity":
        default:
            return [desc(products.reviewCount), desc(products.ratingAvg), asc(products.name)];
    }
}

function resolvedSell(cityId?: string) {
    return cityId ? sellPriceSql() : sql`${products.pricePaise}`;
}

function resolvedCompareAt(cityId?: string) {
    return cityId
        ? sql`coalesce(${cityPrices.compareAtPaise}, ${products.compareAtPaise})`
        : sql`${products.compareAtPaise}`;
}

function publicPricedWhere(
    filter: PublicPricedFilter = {},
    options: { applyCategories?: boolean } = {},
): SQL[] {
    const applyCategories = options.applyCategories !== false;
    const conditions: SQL[] = [eq(products.isActive, true)];
    const priced = or(isNotNull(cityPrices.pricePaise), isNotNull(products.pricePaise));
    if (priced) conditions.push(priced);
    if (applyCategories && filter.categoryIds?.length) {
        conditions.push(inArray(products.categoryId, filter.categoryIds));
    }
    if (filter.instantOnly) {
        conditions.push(eq(products.instantEnabled, true));
    }
    const sell = sellPriceSql();
    if (filter.minPricePaise != null) {
        conditions.push(sql`${sell} >= ${filter.minPricePaise}`);
    }
    if (filter.maxPricePaise != null) {
        conditions.push(sql`${sell} <= ${filter.maxPricePaise}`);
    }
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        const match = or(ilike(products.name, pattern), ilike(products.slug, pattern));
        if (match) conditions.push(match);
    }
    return conditions;
}

function cityPriceJoin(cityId: string) {
    return and(eq(cityPrices.productId, products.id), eq(cityPrices.cityId, cityId));
}

function productListWhere(filter: ProductListFilter = {}): SQL | undefined {
    const conditions: SQL[] = [];
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        const match = or(ilike(products.name, pattern), ilike(products.slug, pattern));
        if (match) conditions.push(match);
    }
    if (filter.isActive !== undefined) {
        conditions.push(eq(products.isActive, filter.isActive));
    }
    if (filter.categoryId) {
        conditions.push(eq(products.categoryId, filter.categoryId));
    }
    const sell = resolvedSell(filter.cityId);
    const compareAt = resolvedCompareAt(filter.cityId);
    if (filter.price === "none") {
        conditions.push(sql`${sell} is null`);
    } else if (filter.price === "set") {
        conditions.push(sql`${sell} is not null`);
    } else if (filter.price === "sale") {
        conditions.push(sql`${sell} is not null`);
        conditions.push(sql`${compareAt} is not null`);
    } else if (filter.cityId) {
        conditions.push(sql`${sell} is not null`);
    }
    return conditions.length ? and(...conditions) : undefined;
}

export class ProductRepository implements IProductRepository {
    async findById(id: string): Promise<Product | undefined> {
        const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        return row;
    }

    async list(
        pagination: PaginationQuery,
        filter: ProductListFilter = {},
    ): Promise<{ items: ProductListRow[]; total: number }> {
        const where = productListWhere(filter);
        const cityJoin = filter.cityId
            ? and(eq(cityPrices.productId, products.id), eq(cityPrices.cityId, filter.cityId))
            : undefined;

        const countQuery = db
            .select({ value: count() })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id));
        const listQuery = db
            .select({
                product: products,
                categoryName: categories.name,
            })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id));

        const counted = cityJoin ? countQuery.leftJoin(cityPrices, cityJoin) : countQuery;
        const listed = cityJoin ? listQuery.leftJoin(cityPrices, cityJoin) : listQuery;

        const [totalRow] = await counted.where(where);
        const rows = await listed
            .where(where)
            .orderBy(desc(products.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        return {
            items: rows.map((row) => ({ ...row.product, categoryName: row.categoryName })),
            total: Number(totalRow?.value ?? 0),
        };
    }

    async insert(data: NewProduct): Promise<Product> {
        const [row] = await db.insert(products).values(data).returning();
        if (!row) {
            throw new Error("failed to create product");
        }
        return row;
    }

    async update(id: string, data: ProductPatch): Promise<Product | undefined> {
        const [row] = await db
            .update(products)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(products.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
        return deleted.length > 0;
    }

    async listImages(productId: string): Promise<ProductImage[]> {
        return db
            .select()
            .from(productImages)
            .where(eq(productImages.productId, productId))
            .orderBy(asc(productImages.sortIndex));
    }

    async listImagesForProductIds(productIds: string[]): Promise<ProductImage[]> {
        const unique = [...new Set(productIds.filter(Boolean))];
        if (unique.length === 0) return [];
        return db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, unique))
            .orderBy(asc(productImages.productId), asc(productImages.sortIndex));
    }

    async replaceImages(productId: string, uploadIds: string[]): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.delete(productImages).where(eq(productImages.productId, productId));
            if (uploadIds.length === 0) return;
            await tx.insert(productImages).values(
                uploadIds.map((uploadId, sortIndex) => ({ productId, uploadId, sortIndex })),
            );
        });
    }

    async listPricedForCity(
        cityId: string,
        filter: { categoryId?: string } = {},
    ): Promise<PricedProduct[]> {
        const result = await this.listPricedForCityPage(
            cityId,
            { categoryIds: filter.categoryId ? [filter.categoryId] : undefined },
            { page: 1, limit: 10_000 },
        );
        return result.items;
    }

    async listPricedForCityPage(
        cityId: string,
        filter: PublicPricedFilter = {},
        pagination: PaginationQuery,
    ): Promise<{ items: PricedProduct[]; total: number }> {
        const conditions = publicPricedWhere(filter);
        const where = and(...conditions);
        const join = cityPriceJoin(cityId);

        const [totalRow] = await db
            .select({ value: count() })
            .from(products)
            .leftJoin(cityPrices, join)
            .where(where);

        const rows = await db
            .select({
                product: products,
                pricePaise: sql<number>`${sellPriceSql()}`.mapWith(Number),
            })
            .from(products)
            .leftJoin(cityPrices, join)
            .where(where)
            .orderBy(...orderByForPublicSort(filter.sort ?? "popularity"))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        return {
            items: rows,
            total: Number(totalRow?.value ?? 0),
        };
    }

    async listCategoryFacets(
        cityId: string,
        filter: Pick<PublicPricedFilter, "minPricePaise" | "maxPricePaise"> = {},
    ): Promise<CategoryFacet[]> {
        const conditions = publicPricedWhere(filter, { applyCategories: false });
        const rows = await db
            .select({
                id: categories.id,
                name: categories.name,
                count: count(),
            })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(cityPrices, cityPriceJoin(cityId))
            .where(and(...conditions, eq(categories.isActive, true)))
            .groupBy(categories.id, categories.name)
            .orderBy(asc(categories.name));

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            count: Number(row.count),
        }));
    }

    async priceRangeForCity(
        cityId: string,
        filter: Pick<PublicPricedFilter, "categoryIds"> = {},
    ): Promise<PriceFacet> {
        const conditions = publicPricedWhere({ categoryIds: filter.categoryIds });
        const sell = sellPriceSql();
        const [row] = await db
            .select({
                minPaise: sql<number>`coalesce(min(${sell}), 0)`.mapWith(Number),
                maxPaise: sql<number>`coalesce(max(${sell}), 0)`.mapWith(Number),
            })
            .from(products)
            .leftJoin(cityPrices, cityPriceJoin(cityId))
            .where(and(...conditions));

        return {
            minPaise: Number(row?.minPaise ?? 0),
            maxPaise: Number(row?.maxPaise ?? 0),
        };
    }

    async findByIds(ids: string[]): Promise<Product[]> {
        if (ids.length === 0) return [];
        return db.select().from(products).where(inArray(products.id, ids));
    }

    async listPricedByIds(cityId: string, ids: string[]): Promise<PricedProduct[]> {
        if (ids.length === 0) return [];
        const priced = or(isNotNull(cityPrices.pricePaise), isNotNull(products.pricePaise));
        const conditions: SQL[] = [inArray(products.id, ids), eq(products.isActive, true)];
        if (priced) conditions.push(priced);
        return db
            .select({
                product: products,
                pricePaise: sql<number>`coalesce(${cityPrices.pricePaise}, ${products.pricePaise})`.mapWith(Number),
            })
            .from(products)
            .leftJoin(cityPrices, cityPriceJoin(cityId))
            .where(and(...conditions));
    }
}
