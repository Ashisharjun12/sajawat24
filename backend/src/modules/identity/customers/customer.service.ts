import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import type { AdminCustomerListQuery } from "@/modules/identity/customers/customer.dto.js";
import type {
    AdminCustomerDetail,
    AdminCustomerListItem,
} from "@/modules/identity/customers/customer.public.js";
import type { ICustomerRepository } from "@/modules/identity/customers/customer.repository.js";
import type { UserStatus } from "@/modules/identity/users/user.schema.js";

export interface ICustomerService {
    listAdmin(query: AdminCustomerListQuery): Promise<{
        items: AdminCustomerListItem[];
        page: number;
        limit: number;
        total: number;
    }>;
    getAdminDetail(id: string): Promise<AdminCustomerDetail>;
    updateStatus(id: string, status: UserStatus): Promise<AdminCustomerDetail>;
}

export class CustomerService implements ICustomerService {
    constructor(private readonly customers: ICustomerRepository) {}

    async listAdmin(query: AdminCustomerListQuery) {
        const pagination = parsePagination(query);
        const result = await this.customers.listAdmin({
            page: pagination.page,
            limit: pagination.limit,
            status: query.status,
            search: query.search,
            cityId: query.cityId,
            hasBookings: query.hasBookings,
            joinedFrom: query.joinedFrom,
            joinedTo: query.joinedTo,
        });
        return {
            items: result.items,
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async getAdminDetail(id: string) {
        const customer = await this.customers.findAdminDetail(id);
        if (!customer) {
            throw ApiError.notFound("customer not found");
        }
        return customer;
    }

    async updateStatus(id: string, status: UserStatus) {
        const existing = await this.customers.findAdminDetail(id);
        if (!existing) {
            throw ApiError.notFound("customer not found");
        }
        if (existing.status === status) {
            return existing;
        }
        const updated = await this.customers.updateStatus(id, status);
        if (!updated) {
            throw ApiError.notFound("customer not found");
        }
        return this.getAdminDetail(id);
    }
}
