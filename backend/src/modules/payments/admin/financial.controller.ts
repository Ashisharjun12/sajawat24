import type { Request } from "express";
import { orderPayablePaise } from "@/modules/booking/orders/order-totals.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { financialAdminService } from "@/modules/payments/admin/financial-admin.service.js";
import { LedgerEntryRepository } from "@/modules/payments/ledger/ledger-entry.repository.js";
import { orderFinancialService } from "@/modules/payments/order-financials/order-financial.service.js";
import { refundExecutionService } from "@/modules/booking/refunds/refund-execution.service.js";
import { PaymentIntentRepository } from "@/modules/payments/intents/payment-intent.repository.js";
import { settingService } from "@/modules/ops/index.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";

export class FinancialAdminController {
    private readonly orders = new OrderRepository();
    private readonly entries = new LedgerEntryRepository();
    private readonly intents = new PaymentIntentRepository();

    overview = asyncHandler(async (_req, res) => {
        const data = await financialAdminService.getOverview();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    vendorWallet = asyncHandler(async (req, res) => {
        const vendorId = String(req.params.vendorId);
        const { walletService } = await import("@/modules/payments/wallets/wallet.service.js");
        const { settingService } = await import("@/modules/ops/index.js");
        const wallet = await walletService.getSummary(vendorId);
        const policy = await settingService.getPayoutPolicy();
        res.status(200).json(
            new ApiResponse(
                200,
                {
                    ...wallet,
                    assignable: wallet.codDuesPaise <= policy.codMaxDuePaise,
                    codMaxDuePaise: policy.codMaxDuePaise,
                    minWithdrawalPaise: policy.minWithdrawalPaise,
                },
                "ok",
            ),
        );
    });

    vendorLiabilities = asyncHandler(async (req, res) => {
        const data = await financialAdminService.listVendorLiabilities({
            q: typeof req.query.q === "string" ? req.query.q : undefined,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    payoutRequests = asyncHandler(async (req, res) => {
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const data = await financialAdminService.listPayoutRequests({
            q: typeof req.query.q === "string" ? req.query.q : undefined,
            status: status as
                | "pending"
                | "processing"
                | "paid"
                | "failed"
                | "cancelled"
                | undefined,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    payoutRequestDetail = asyncHandler(async (req, res) => {
        const data = await financialAdminService.getPayoutRequestDetail(String(req.params.id));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    updatePayoutRequest = asyncHandler(async (req: Request, res) => {
        const adminUserId = req.actor?.id;
        if (!adminUserId) throw ApiError.unauthorized();
        const data = await financialAdminService.updatePayoutRequestStatus(String(req.params.id), {
            status: req.body.status,
            failureReason: req.body.failureReason,
            adminUserId,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    codPendingOrders = asyncHandler(async (req, res) => {
        const data = await financialAdminService.listCodPendingOrders({
            q: typeof req.query.q === "string" ? req.query.q : undefined,
            status: typeof req.query.status === "string" ? req.query.status : undefined,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    orderBreakdown = asyncHandler(async (req: Request, res) => {
        const orderId = String(req.params.orderId);
        const order = await this.orders.findById(orderId);
        if (!order) throw ApiError.notFound("order not found");

        const financials = await orderFinancialService.getByOrderId(orderId);
        const ledger = await this.entries.listForOrder(orderId);
        const intent = await this.intents.findByOrderId(orderId);
        const currentPolicy = await settingService.getPayoutPolicy();
        const hasReversal = await refundExecutionService.hasLedgerReversal(orderId);

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    order: {
                        id: order.id,
                        reference: order.reference,
                        status: order.status,
                        paymentMethod: order.paymentMethod,
                        subtotalPaise: order.subtotalPaise,
                        discountPaise: order.discountPaise,
                        totalPaise: orderPayablePaise(order),
                        couponCode: order.couponCode,
                        collectionStatus: order.collectionStatus,
                        collectionMethod: order.collectionMethod,
                        collectedAt: order.collectedAt?.toISOString() ?? null,
                        ledgerPostedAt: order.ledgerPostedAt?.toISOString() ?? null,
                    },
                    financials: financials ?? null,
                    currentPolicyPercent: currentPolicy.platformCommissionPercent,
                    paymentIntent: intent ?? null,
                    ledger,
                    canRefund:
                        intent?.status === "paid" &&
                        order.paymentMethod === "ONLINE" &&
                        !hasReversal,
                    warnings: buildPaymentWarnings(order, financials, currentPolicy),
                },
                "ok",
            ),
        );
    });

    platformRevenue = asyncHandler(async (_req, res) => {
        const revenue = await this.entries.accountBalance(null, "platform_revenue");
        res.status(200).json(new ApiResponse(200, { platformRevenuePaise: revenue }, "ok"));
    });

    refundOrder = asyncHandler(async (req: Request, res) => {
        const orderId = String(req.params.orderId);
        const order = await this.orders.findById(orderId);
        if (!order) throw ApiError.notFound("order not found");

        await refundExecutionService.executeOrderRefund(
            orderId,
            String(req.body.reason ?? "admin refund"),
        );
        res.status(200).json(new ApiResponse(200, { orderId }, "refund processed"));
    });

    repostOrderLedger = asyncHandler(async (req, res) => {
        const data = await financialAdminService.repostOrderLedger(String(req.params.orderId));
        res.status(200).json(new ApiResponse(200, data, "ledger reposted"));
    });
}

function buildPaymentWarnings(
    order: {
        paymentMethod: string;
        collectionStatus: string;
        status: string;
    },
    financials: { platformPercentSnapshot: number } | undefined,
    currentPolicy: { platformCommissionPercent: number },
): string[] {
    const warnings: string[] = [];
    if (
        order.paymentMethod === "COD" &&
        order.collectionStatus === "pending" &&
        (order.status === "ON_SITE" || order.status === "EN_ROUTE")
    ) {
        warnings.push("COD collection is still pending at delivery.");
    }
    if (
        financials &&
        financials.platformPercentSnapshot !== currentPolicy.platformCommissionPercent
    ) {
        warnings.push(
            `Commission snapshot (${financials.platformPercentSnapshot}%) differs from current policy (${currentPolicy.platformCommissionPercent}%).`,
        );
    }
    return warnings;
}
