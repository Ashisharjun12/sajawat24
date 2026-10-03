import { api, unwrap } from '@/api/client';

export type CollectionStatus = {
  collectionStatus: string;
  collectionMethod: string | null;
  collectedAt: string | null;
  activeSession: {
    provider: string;
    qrImageUrl?: string;
    qrBase64?: string;
    shareUrl?: string;
    expiresAt: string;
  } | null;
};

export function getCollectionStatus(orderId: string) {
  return api.get(`/vendor/jobs/${orderId}/collect/status`).then(unwrap<CollectionStatus>);
}

export function collectCash(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/collect/cash`).then(unwrap<CollectionStatus>);
}

export function collectOnline(orderId: string) {
  return api.post(`/vendor/jobs/${orderId}/collect/online`).then(unwrap<CollectionStatus>);
}
