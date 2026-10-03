/** Allowed order transitions for V1 scheduled booking. See docs/project-requriment.md */

export const ORDER_STATUSES = [
    "DRAFT",
    "PENDING_PAYMENT",
    "CONFIRMED",
    "ASSIGNED",
    "EN_ROUTE",
    "ON_SITE",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
    DRAFT: ["PENDING_PAYMENT", "CANCELLED"],
    PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["EN_ROUTE", "CANCELLED"],
    EN_ROUTE: ["ON_SITE", "DISPUTED"],
    ON_SITE: ["COMPLETED", "DISPUTED"],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: ["COMPLETED", "CANCELLED"],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!canTransition(from, to)) {
        throw new Error(`Illegal order transition ${from} → ${to}`);
    }
}
