import { settingService } from "@/modules/ops/index.js";
import { computeOrderSplit } from "@/modules/payments/ledger/split-engine.js";
import { OrderFinancialRepository } from "@/modules/payments/order-financials/order-financial.repository.js";
import type { OrderFinancial } from "@/modules/payments/order-financials/order-financial.schema.js";

export class OrderFinancialService {
    private readonly repo = new OrderFinancialRepository();

    async snapshotForOrder(
        orderId: string,
        grossPaise: number,
        discountPaise = 0,
    ): Promise<OrderFinancial> {
        const policy = await settingService.getPayoutPolicy();
        const split = computeOrderSplit(grossPaise, policy.platformCommissionPercent);
        return this.repo.insert({
            orderId,
            grossPaise: split.grossPaise,
            discountPaise,
            platformPercentSnapshot: split.platformPercent,
            platformFeePaise: split.platformFeePaise,
            vendorSharePaise: split.vendorSharePaise,
        });
    }

    async getByOrderId(orderId: string): Promise<OrderFinancial | undefined> {
        return this.repo.findByOrderId(orderId);
    }
}

export const orderFinancialService = new OrderFinancialService();
