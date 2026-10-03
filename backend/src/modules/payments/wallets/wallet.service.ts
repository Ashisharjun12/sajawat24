import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { settingService } from "@/modules/ops/index.js";
import { payoutMethodService } from "@/modules/payments/payout-methods/payout-method.service.js";
import { LedgerEntryRepository } from "@/modules/payments/ledger/ledger-entry.repository.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { PayoutRepository } from "@/modules/payments/payouts/payout.repository.js";
import { PayoutService } from "@/modules/payments/payouts/payout.service.js";
import { walletActivityService } from "@/modules/payments/wallets/wallet-activity.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { paginationOffset, parsePagination, type Paginated } from "@/shared/http/pagination.js";

export type WalletSummary = {
    pendingPaise: number;
    availablePaise: number;
    codDuesPaise: number;
    earnedPaise: number;
    earnedThisMonthPaise: number;
    minWithdrawalPaise: number;
    codMaxDuePaise: number;
    autoNetCodFromEarnings: boolean;
    assignable: boolean;
    hasPayoutMethod: boolean;
    hasActiveWithdrawal: boolean;
};

export type WalletTransaction = {
    id: string;
    orderId: string | null;
    debitAccount: string;
    creditAccount: string;
    amountPaise: number;
    createdAt: string;
    metadata: Record<string, unknown> | null;
};

export class WalletService {
    private readonly entries = new LedgerEntryRepository();
    private readonly payouts = new PayoutService();
    private readonly payoutRequests = new PayoutRepository();
    private readonly vendors = new VendorRepository();

    private async vendorIdForUser(userId: string): Promise<string> {
        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor) throw ApiError.forbidden("vendor profile not found");
        return vendor.id;
    }

    async getSummaryForUser(userId: string): Promise<WalletSummary> {
        const vendorId = await this.vendorIdForUser(userId);
        return this.getSummary(vendorId);
    }

    async getSummary(vendorId: string): Promise<WalletSummary> {
        const policy = await settingService.getPayoutPolicy();
        const pendingPaise = Math.max(0, await this.entries.accountBalance(vendorId, "vendor_pending"));
        const payablePaise = Math.max(0, await this.entries.accountBalance(vendorId, "vendor_payable"));
        const codDuesPaise = await ledgerService.getVendorCodDue(vendorId);
        const earnedThisMonthPaise = await this.entries.sumVendorEarningsThisMonthIst(vendorId);
        const payoutMethods = await payoutMethodService.listForUserByVendorId(vendorId);
        const hasActiveWithdrawal = await this.payoutRequests.hasActiveRequest(vendorId);

        const availablePaise = payablePaise;
        const earnedPaise = pendingPaise + payablePaise;

        return {
            pendingPaise,
            availablePaise,
            codDuesPaise,
            earnedPaise,
            earnedThisMonthPaise,
            minWithdrawalPaise: policy.minWithdrawalPaise,
            codMaxDuePaise: policy.codMaxDuePaise,
            autoNetCodFromEarnings: policy.autoNetCodFromEarnings,
            assignable: codDuesPaise <= policy.codMaxDuePaise,
            hasPayoutMethod: payoutMethods.length > 0,
            hasActiveWithdrawal,
        };
    }

    async listActivityForUser(
        userId: string,
        query: { page?: number; limit?: number; type?: string; from?: string; to?: string },
    ) {
        const vendorId = await this.vendorIdForUser(userId);
        return walletActivityService.listForVendor(vendorId, query);
    }

    async listTransactionsForUser(
        userId: string,
        query: { page?: number; limit?: number },
    ): Promise<Paginated<WalletTransaction>> {
        const vendorId = await this.vendorIdForUser(userId);
        return this.listTransactions(vendorId, query);
    }

    async listTransactions(
        vendorId: string,
        query: { page?: number; limit?: number },
    ): Promise<Paginated<WalletTransaction>> {
        const pagination = parsePagination(query);
        const result = await this.entries.listForVendor(vendorId, {
            limit: pagination.limit,
            offset: paginationOffset(pagination),
        });

        return {
            items: result.items.map((row) => ({
                id: row.id,
                orderId: row.orderId,
                debitAccount: row.debitAccount,
                creditAccount: row.creditAccount,
                amountPaise: row.amountPaise,
                createdAt: row.createdAt.toISOString(),
                metadata: (row.metadata as Record<string, unknown> | null) ?? null,
            })),
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async withdrawForUser(userId: string, amountPaise: number, payoutMethodId: string) {
        const vendorId = await this.vendorIdForUser(userId);
        return this.withdraw(vendorId, amountPaise, payoutMethodId);
    }

    async listPayoutRequestsForUser(
        userId: string,
        query: { page?: number; limit?: number },
    ) {
        const vendorId = await this.vendorIdForUser(userId);
        const pagination = parsePagination(query);
        const result = await this.payoutRequests.list({
            vendorId,
            limit: pagination.limit,
            offset: paginationOffset(pagination),
        });
        return {
            items: result.items,
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async withdraw(vendorId: string, amountPaise: number, payoutMethodId: string) {
        const policy = await settingService.getPayoutPolicy();
        if (amountPaise < policy.minWithdrawalPaise) {
            throw ApiError.badRequest("amount is below minimum withdrawal");
        }

        if (await this.payoutRequests.hasActiveRequest(vendorId)) {
            throw ApiError.conflict("a withdrawal is already in progress");
        }

        await payoutMethodService.getForVendorWithdraw(vendorId, payoutMethodId);

        const summary = await this.getSummary(vendorId);
        if (amountPaise > summary.availablePaise) {
            throw ApiError.badRequest("insufficient available balance");
        }

        return this.payouts.requestWithdrawal(vendorId, amountPaise, payoutMethodId);
    }
}

export const walletService = new WalletService();
