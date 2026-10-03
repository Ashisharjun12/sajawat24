export type OrderSplit = {
    grossPaise: number;
    platformPercent: number;
    platformFeePaise: number;
    vendorSharePaise: number;
};

export function computeOrderSplit(grossPaise: number, platformCommissionPercent: number): OrderSplit {
    if (grossPaise < 0) {
        throw new Error("grossPaise must be non-negative");
    }
    const platformPercent = Math.min(50, Math.max(0, Math.round(platformCommissionPercent)));
    const platformFeePaise = Math.floor((grossPaise * platformPercent) / 100);
    const vendorSharePaise = grossPaise - platformFeePaise;
    return {
        grossPaise,
        platformPercent,
        platformFeePaise,
        vendorSharePaise,
    };
}
