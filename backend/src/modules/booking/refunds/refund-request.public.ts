import type { RefundRequest } from "@/modules/booking/refunds/refund-request.schema.js";

export type PublicRefundRequest = {
    id: string;
    orderId: string;
    orderRef: string;
    productName: string;
    imageUrl: string | null;
    amountPaise: number;
    reason: string;
    status: RefundRequest["status"];
    paymentMethod: RefundRequest["paymentMethod"];
    adminNote: string | null;
    requestedAt: string;
    completedAt: string | null;
};

export type AdminRefundRequest = PublicRefundRequest & {
    userId: string;
    customerName: string;
    customerPhone: string | null;
};

export function toPublicRefundRequest(
    row: RefundRequest,
    meta: { orderRef: string; productName: string; imageUrl: string | null },
): PublicRefundRequest {
    return {
        id: row.id,
        orderId: row.orderId,
        orderRef: meta.orderRef,
        productName: meta.productName,
        imageUrl: meta.imageUrl,
        amountPaise: row.amountPaise,
        reason: row.reason,
        status: row.status,
        paymentMethod: row.paymentMethod,
        adminNote: row.adminNote,
        requestedAt: row.requestedAt.toISOString(),
        completedAt: row.completedAt?.toISOString() ?? null,
    };
}

export function toAdminRefundRequest(
    row: RefundRequest,
    meta: {
        orderRef: string;
        productName: string;
        imageUrl: string | null;
        customerName: string;
        customerPhone: string | null;
    },
): AdminRefundRequest {
    return {
        ...toPublicRefundRequest(row, meta),
        userId: row.userId,
        customerName: meta.customerName,
        customerPhone: meta.customerPhone,
    };
}
