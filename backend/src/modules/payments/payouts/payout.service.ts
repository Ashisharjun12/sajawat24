import { LedgerEntryRepository } from "@/modules/payments/ledger/ledger-entry.repository.js";
import { PayoutRepository } from "@/modules/payments/payouts/payout.repository.js";
import { ApiError } from "@/shared/errors/apiError.js";

export class PayoutService {
    private readonly payouts = new PayoutRepository();
    private readonly entries = new LedgerEntryRepository();

    async requestWithdrawal(
        vendorId: string,
        amountPaise: number,
        payoutMethodId: string,
    ) {
        const request = await this.payouts.create({
            vendorId,
            amountPaise,
            payoutMethodId,
            status: "pending",
            provider: "manual",
        });

        const inserted = await this.entries.insert({
            orderId: null,
            vendorId,
            debitAccount: "vendor_payable",
            creditAccount: "platform_cash",
            amountPaise,
            idempotencyKey: `withdraw:${request.id}`,
            metadata: { kind: "withdraw_request", payoutRequestId: request.id },
        });
        if (!inserted) {
            throw ApiError.conflict("withdrawal already processing");
        }

        return {
            id: request.id,
            amountPaise: request.amountPaise,
            status: request.status,
            message: "Withdrawal queued. Admin will process the payout manually.",
        };
    }
}
