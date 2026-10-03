import { sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { settingService } from "@/modules/ops/index.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { logger } from "@/utils/logger.js";

export async function processSettlementSweepJob(): Promise<void> {
    const policy = await settingService.getPayoutPolicy();
    const rows = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(sql`${vendors.onboardingStatus} = 'ACTIVE'`);

    let settled = 0;
    for (const row of rows) {
        const amount = await ledgerService.settleVendorPending(row.id, policy.settlementHoldDays);
        if (amount > 0) settled += 1;
    }
    logger.info({ vendors: rows.length, settled }, "settlement sweep complete");
}
