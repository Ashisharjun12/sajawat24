import { settingService } from "@/modules/ops/index.js";
import type { Product } from "@/modules/catalog/products/product.schema.js";

export type PublicInstantInfo = {
    enabled: boolean;
    showBadge: boolean;
    badgeLabel: string;
    pdpNote: string | null;
    etaMinutes: number | null;
};

export async function buildPublicInstantBlock(
    product: Pick<
        Product,
        | "instantEnabled"
        | "instantShowBadge"
        | "instantBadgeLabel"
        | "instantPdpNote"
        | "instantEtaMinutes"
    >,
): Promise<PublicInstantInfo | null> {
    const marketplace = await settingService.getInstantMarketplacePolicy();
    if (!marketplace.enabled || !product.instantEnabled) {
        return null;
    }
    return {
        enabled: true,
        showBadge: product.instantShowBadge,
        badgeLabel: product.instantBadgeLabel?.trim() || "Instant",
        pdpNote: product.instantPdpNote,
        etaMinutes: product.instantEtaMinutes,
    };
}
