import { api, unwrap } from '@/api/client';

export type CreateOrderBody = {
  customer: { name: string; phone: string; email: string };
  delivery: {
    pincode: string;
    address: string;
    landmark?: string;
    cityId: string;
    latitude?: number;
    longitude?: number;
  };
  paymentMethod: 'cod' | 'online';
  idempotencyKey: string;
};

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type OrderListBucket = 'all' | 'upcoming' | 'completed' | 'cancelled';

export type PublicOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
};

export type PublicAssignee = {
  id: string;
  name: string;
  phone: string | null;
  pincode: string;
  cityName: string;
  vendorResponse?: 'pending' | 'accepted' | 'declined';
};

export type PublicServiceContact = {
  kind: 'worker' | 'shop';
  name: string;
  phone: string | null;
  shopName?: string | null;
  vendorPhone?: string | null;
  vendorName?: string | null;
};

export type PublicOrder = {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentMethod?: string;
  scheduledAt: string;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  couponCode: string | null;
  customer: { name: string; phone: string; email: string };
  delivery: {
    address: string;
    landmark: string | null;
    cityName: string;
    pincode: string;
  };
  items: PublicOrderItem[];
  canReview: boolean;
  reviewSubmitted: boolean;
  fulfillmentType?: 'scheduled' | 'instant';
  dispatchStatus?: string;
  assignee?: PublicAssignee | null;
  serviceContact?: PublicServiceContact | null;
  deliveryCodePending?: boolean;
};

export type PublicOrderTracking = {
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

export type PublicOrderSummary = {
  id: string;
  reference: string;
  status: OrderStatus;
  scheduledAt: string;
  subtotalPaise: number;
  cityName: string;
  pincode: string;
  delivery: {
    address: string;
    landmark: string | null;
  };
  primaryName: string;
  primaryImageUrl: string | null;
  itemCount: number;
  canReview: boolean;
  reviewSubmitted: boolean;
};

export type CreateOrderResponse = {
  order: PublicOrder;
  checkout?: Record<string, unknown>;
};

export type PaginatedOrders = {
  items: PublicOrderSummary[];
  page: number;
  limit: number;
  total: number;
};

export function createOrder(body: CreateOrderBody) {
  return api.post('/orders', body).then(unwrap<CreateOrderResponse>);
}

export function getOrder(id: string) {
  return api.get(`/orders/${id}`).then(unwrap<PublicOrder>);
}

export function getOrderTracking(id: string) {
  return api.get(`/orders/${id}/tracking`).then(unwrap<PublicOrderTracking>);
}

export type PublicOrderRoute = {
  encodedPolyline: string;
  distanceMeters: number;
  durationSeconds: number;
};

export function getOrderRoute(id: string) {
  return api.get(`/orders/${id}/route`).then(unwrap<PublicOrderRoute>);
}

export type ListOrdersParams = {
  page?: number;
  limit?: number;
  bucket?: OrderListBucket;
};

export function listOrders(params: ListOrdersParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const bucket = params.bucket ?? 'all';
  return api
    .get(`/orders?page=${page}&limit=${limit}&bucket=${bucket}`)
    .then(unwrap<PaginatedOrders>);
}

export function cancelPendingOrder(id: string) {
  return api.post(`/orders/${id}/cancel`).then(unwrap<{ id: string; status: OrderStatus }>);
}

export function resumeOrderCheckout(id: string) {
  return api.post(`/orders/${id}/checkout`).then(unwrap<CreateOrderResponse>);
}

export type SubmitOrderReviewBody = {
  rating: number;
  body: string;
  productId?: string;
};

export function submitOrderReview(orderId: string, body: SubmitOrderReviewBody) {
  return api.post(`/orders/${orderId}/review`, body).then(unwrap<{ canReview: boolean; reviewSubmitted: boolean }>);
}
