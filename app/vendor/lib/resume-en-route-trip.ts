import { listVendorJobs } from '@/api/jobs.api';
import type { JobFilter } from '@/module/bookings/lib/booking.types';

const EN_ROUTE_FILTERS: JobFilter[] = ['today', 'upcoming', 'action'];

/** Find a job still marked EN_ROUTE for the signed-in field worker. */
export async function findActiveEnRouteJobId(): Promise<string | null> {
  for (const filter of EN_ROUTE_FILTERS) {
    const page = await listVendorJobs({ filter, limit: 50 });
    const hit = page.items.find((job) => job.status === 'EN_ROUTE');
    if (hit) return hit.id;
  }
  return null;
}
