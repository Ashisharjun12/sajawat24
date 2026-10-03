import { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { logger } from "@/utils/logger.js";

export async function processLedgerPostOnCompleteJob(job: {
    data: { orderId: string };
}): Promise<void> {
    const assignmentRepo = new AssignmentRepository();
    const assignment = await assignmentRepo.findByOrderId(job.data.orderId);
    if (!assignment) {
        logger.warn({ orderId: job.data.orderId }, "ledger post-on-complete: no assignment");
        return;
    }
    await ledgerService.postOnComplete(job.data.orderId, assignment.vendorId);
}
