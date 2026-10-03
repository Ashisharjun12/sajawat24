/**
 * Public API: admin assign, calendar overlap, vendor job list.
 */
export { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
export type { AssigneeDetail, IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
export { AssignmentService } from "@/modules/assignment/assignments/assignment.service.js";
export type { IAssignmentService } from "@/modules/assignment/assignments/assignment.service.js";
export { AssignmentController } from "@/modules/assignment/assignments/assignment.controller.js";
export {
    assignVendorDto,
    assignCandidatesQueryDto,
} from "@/modules/assignment/assignments/assignment.dto.js";
export { assignments } from "@/modules/assignment/assignments/assignment.schema.js";
export { VENDOR_JOB_ASSIGNED_EVENT } from "@/modules/assignment/lib/assignment.events.js";
export { VendorJobController } from "@/modules/assignment/jobs/vendor-job.controller.js";
export { VendorJobRepository } from "@/modules/assignment/jobs/vendor-job.repository.js";
export { VendorJobService } from "@/modules/assignment/jobs/vendor-job.service.js";
export type { IVendorJobService, VendorJobDetail, VendorJobSummary } from "@/modules/assignment/jobs/vendor-job.service.js";
