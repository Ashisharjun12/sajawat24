export function canSettleCodCollectionPayment(input: {
    collectionStatus: string;
    sessionAmountPaise: number;
    orderSubtotalPaise: number;
    webhookAmountPaise: number;
}): boolean {
    if (
        input.collectionStatus === "collected_cash" ||
        input.collectionStatus === "collected_online"
    ) {
        return false;
    }
    if (input.collectionStatus !== "pending") {
        return false;
    }
    if (input.sessionAmountPaise !== input.webhookAmountPaise) {
        return false;
    }
    if (input.orderSubtotalPaise !== input.webhookAmountPaise) {
        return false;
    }
    return true;
}
