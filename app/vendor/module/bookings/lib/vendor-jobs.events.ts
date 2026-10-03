/**
 * Realtime + push event names related to vendor job assignments.
 * Keep in sync with the backend's `VENDOR_JOB_ASSIGNED_EVENT`
 * (backend/src/modules/assignment/lib/assignment.events.ts) and the
 * `VENDOR_NEW_JOB` notification event key.
 */

/** Socket.IO event emitted the moment an admin assigns a booking to this vendor. */
export const VENDOR_JOB_ASSIGNED_EVENT = 'vendor:job_assigned';

/** Socket event when a field worker updates job status (owner list refresh). */
export const VENDOR_JOB_UPDATED_EVENT = 'vendor:job_updated';

/** Push / in-app notification event key carried in notification data payloads. */
export const VENDOR_NEW_JOB_NOTIFICATION_EVENT = 'VENDOR_NEW_JOB';
