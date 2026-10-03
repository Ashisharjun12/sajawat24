import type { IOrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";

/** Field worker user id when one worker is assigned to the order. */
export async function assignedFieldWorkerUserId(
    fieldAssignments: IOrderFieldAssignmentRepository,
    vendorId: string,
    orderId: string,
): Promise<string | null> {
    const rows = await fieldAssignments.listForOrder(vendorId, orderId);
    return rows[0]?.userId ?? null;
}

/** Shop owner should not use booking chat when a different field worker is assigned. */
export function isDistinctFieldWorkerAssigned(
    ownerUserId: string,
    workerUserId: string | null,
): boolean {
    return Boolean(workerUserId && workerUserId !== ownerUserId);
}
