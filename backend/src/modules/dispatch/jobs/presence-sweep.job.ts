import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import {
    geoRemoveVendorOnline,
    getVendorLastSeen,
} from "@/modules/dispatch/geo/vendor-geo.store.js";
import { settingService } from "@/modules/ops/index.js";
import { logger } from "@/utils/logger.js";

export async function processPresenceSweepJob(): Promise<void> {
    const policy = await settingService.getInstantDispatchPolicy();
    if (!policy.enabled) return;

    const staleMs = policy.staleSec * 1000;
    const now = Date.now();
    const online = await db
        .select({ id: vendors.id, cityId: vendors.cityId })
        .from(vendors)
        .where(eq(vendors.isOnDuty, true));

    for (const row of online) {
        if (!row.cityId) continue;
        const lastSeen = await getVendorLastSeen(row.id);
        if (lastSeen === null || now - lastSeen > staleMs) {
            await geoRemoveVendorOnline(row.cityId, row.id);
            logger.info({ vendorId: row.id }, "presence sweep removed stale vendor from geo");
        }
    }
}
