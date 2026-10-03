import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import type { ICityRepository } from "@/modules/geo/cities/city.repository.js";
import { publicCity, slugify, type PublicCity } from "@/modules/geo/cities/city.public.js";
import type { City } from "@/modules/geo/cities/city.schema.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import { displayUrl, getCompletedUpload, toPublicMedia, type PublicMedia } from "@/modules/upload/index.js";

export type CityImage = (PublicMedia & { url: string }) | null;

export type CityAdmin = City & { image: CityImage };

export type CreateCityInput = {
    name: string;
    state: string;
    slug?: string;
    imageUploadId?: string | null;
    isActive?: boolean;
};

export type PatchCityInput = {
    name?: string;
    state?: string;
    slug?: string;
    imageUploadId?: string | null;
    isActive?: boolean;
};

export type CityAdminListQuery = {
    page?: unknown;
    limit?: unknown;
    q?: unknown;
    isActive?: unknown;
};

export interface ICityService {
    listActive(): Promise<PublicCity[]>;
    listAdmin(query: CityAdminListQuery): Promise<{
        items: CityAdmin[];
        page: number;
        limit: number;
        total: number;
    }>;
    create(input: CreateCityInput): Promise<CityAdmin>;
    patch(id: string, input: PatchCityInput): Promise<CityAdmin>;
}

export class CityService implements ICityService {
    constructor(private readonly cities: ICityRepository) {}

    async listActive(): Promise<PublicCity[]> {
        const rows = await this.cities.listActive();
        return Promise.all(
            rows.map(async (row) => {
                const image = await this.toImage(row.imageUploadId);
                return publicCity(row, image?.url ?? null);
            }),
        );
    }

    async listAdmin(query: CityAdminListQuery) {
        const pagination = parsePagination(query);
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const isActive =
            query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;
        const { items, total } = await this.cities.list(pagination, {
            q: q || undefined,
            isActive,
        });
        const withMedia = await Promise.all(items.map((item) => this.toAdmin(item)));
        return { items: withMedia, page: pagination.page, limit: pagination.limit, total };
    }

    async create(input: CreateCityInput): Promise<CityAdmin> {
        const name = input.name.trim();
        const state = input.state.trim();
        const slug = slugify(input.slug?.trim() || name);
        if (!slug) {
            throw ApiError.badRequest("invalid city slug");
        }
        const imageUploadId = await this.assertImage(input.imageUploadId);
        try {
            const row = await this.cities.insert({
                name,
                slug,
                state,
                imageUploadId,
                isActive: input.isActive ?? true,
            });
            return this.toAdmin(row);
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("city name or slug already exists");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchCityInput): Promise<CityAdmin> {
        const existing = await this.cities.findById(id);
        if (!existing) {
            throw ApiError.notFound("city not found");
        }
        const data: Parameters<ICityRepository["update"]>[1] = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.state !== undefined) data.state = input.state.trim();
        if (input.slug !== undefined) {
            const slug = slugify(input.slug);
            if (!slug) throw ApiError.badRequest("invalid city slug");
            data.slug = slug;
        } else if (input.name !== undefined) {
            data.slug = slugify(input.name);
        }
        if (input.imageUploadId !== undefined) {
            data.imageUploadId = await this.assertImage(input.imageUploadId);
        }
        if (input.isActive !== undefined) data.isActive = input.isActive;
        try {
            const row = await this.cities.update(id, data);
            if (!row) {
                throw ApiError.notFound("city not found");
            }
            return this.toAdmin(row);
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("city name or slug already exists");
            }
            throw err;
        }
    }

    private async assertImage(imageUploadId: string | null | undefined): Promise<string | null> {
        if (!imageUploadId) {
            return null;
        }
        const upload = await getCompletedUpload(imageUploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("city image must be an image upload");
        }
        return imageUploadId;
    }

    private async toAdmin(row: City): Promise<CityAdmin> {
        return { ...row, image: await this.toImage(row.imageUploadId) };
    }

    private async toImage(imageUploadId: string | null): Promise<CityImage> {
        if (!imageUploadId) return null;
        try {
            const upload = await getCompletedUpload(imageUploadId);
            return { ...toPublicMedia(upload), url: displayUrl(upload) };
        } catch {
            return null;
        }
    }
}
