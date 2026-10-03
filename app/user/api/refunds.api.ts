import { api, unwrap } from '@/api/client';

export type RefundListItem = {
  id: string;
  orderId: string;
  orderRef: string;
  productName: string;
  imageUrl?: string | null;
  amountPaise: number;
  status: string;
  requestedAt: string;
  completedAt?: string | null;
};

export function listRefunds(params: { page?: number; limit?: number } = {}) {
  return api.get('/user/refunds', { params }).then(unwrap<{ items?: RefundListItem[] }>);
}

export function createRefundRequest(orderId: string, body: { reason?: string }) {
  return api.post(`/user/refunds/orders/${orderId}`, body).then(unwrap);
}

export function getLatestRefundForOrder(orderId: string) {
  return api.get(`/user/refunds/orders/${orderId}/latest`).then(unwrap<{ refund?: unknown }>);
}
