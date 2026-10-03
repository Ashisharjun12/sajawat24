import { api, unwrap } from '@/api/client';
import type {
  JobFilter,
  VendorJobDetail,
  VendorJobsResponse,
} from '@/module/bookings/lib/booking.types';

export function listVendorJobs(params?: {
  filter?: JobFilter;
  page?: number;
  limit?: number;
  q?: string;
}) {
  return api.get('/vendor/jobs', { params }).then(unwrap<VendorJobsResponse>);
}

export function getVendorJob(orderId: string) {
  return api.get(`/vendor/jobs/${orderId}`).then(unwrap<VendorJobDetail>);
}

export function getVendorJobRoute(orderId: string) {
  return api
    .get(`/vendor/jobs/${orderId}/route`)
    .then(unwrap<{ encodedPolyline: string; distanceMeters: number; durationSeconds: number }>);
}

export type VendorJobTracking = {
  orderId: string;
  status: string;
  destination: { latitude: number; longitude: number } | null;
  vendor: {
    latitude: number | null;
    longitude: number | null;
    heading?: number;
    updatedAt: string | null;
    stale: boolean;
    distanceMeters?: number;
  } | null;
  liveTrackingEnabled: boolean;
  webMapEnabled: boolean;
};

export function getVendorJobTracking(orderId: string) {
  return api.get(`/vendor/jobs/${orderId}/tracking`).then(unwrap<VendorJobTracking>);
}

export function acceptVendorJob(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/accept`).then(unwrap<VendorJobDetail>);
}

export function declineVendorJob(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/decline`).then(unwrap<{ ok: boolean }>);
}

export function markVendorJobEnRoute(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/en-route`).then(unwrap<VendorJobDetail>);
}

export function markVendorJobOnSite(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/on-site`).then(unwrap<VendorJobDetail>);
}

export function sendVendorDeliveryCode(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/send-delivery-code`).then(unwrap<VendorJobDetail>);
}

export function completeVendorJob(orderId: string, code: string) {
  return api.post(`/vendor/jobs/${orderId}/complete`, { code }).then(unwrap<VendorJobDetail>);
}

export function postVendorJobLocation(
  orderId: string,
  body: { latitude: number; longitude: number; heading?: number; speed?: number },
) {
  return api
    .post(`/vendor/jobs/${orderId}/location`, body)
    .then(unwrap<{ ok: boolean; suggestOnSite?: boolean }>);
}

export function postVendorPresence(body: {
  latitude: number;
  longitude: number;
  onDuty?: boolean;
}) {
  return api.post('/vendor/presence', body).then(unwrap<{ onDuty: boolean }>);
}

export function postVendorPresenceHeartbeat() {
  return api.post('/vendor/presence/heartbeat').then(unwrap<{ ok: boolean }>);
}
