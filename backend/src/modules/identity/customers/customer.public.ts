import type { UserStatus } from "@/modules/identity/users/user.schema.js";
import type { OrderStatus } from "@/modules/booking/domain/order-status.js";

export type AdminCustomerListItem = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: UserStatus;
    bookingCount: number;
    createdAt: Date;
};

export type AdminCustomerOrderSummary = {
    id: string;
    reference: string;
    status: OrderStatus;
    cityName: string;
    scheduledAt: Date;
    totalPaise: number;
};

export type AdminCustomerDetail = AdminCustomerListItem & {
    avatar: string | null;
    bookingCount: number;
    completedCount: number;
    cancelledCount: number;
    totalSpendPaise: number;
    lastBookingAt: Date | null;
    recentOrders: AdminCustomerOrderSummary[];
};
