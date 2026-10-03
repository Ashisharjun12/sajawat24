

export type PaginationQuery = {
    page: number;
    limit: number;
};

export type Paginated<T> = {
    items: T[];
    page: number;
    limit: number;
    total: number;
};

export function parsePagination(query: { page?: unknown; limit?: unknown }): PaginationQuery {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return { page, limit };
}

export function paginationOffset({ page, limit }: PaginationQuery): number {
    return (page - 1) * limit;
}
