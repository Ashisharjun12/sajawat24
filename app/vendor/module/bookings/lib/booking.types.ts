export type BookingStatus =
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'COMPLETED';

export type PaymentMethod = 'ONLINE' | 'COD';

export type VendorResponse = 'pending' | 'accepted' | 'declined';

export type VendorJobItemAddon = {
  id: string;
  name: string;
  quantity: number;
  pricePaise: number;
  imageUrl?: string | null;
};

export type VendorJobItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  productPaise: number;
  addonsPaise: number;
  lineTotalPaise: number;
  addons: VendorJobItemAddon[];
};

export type VendorJobSummary = {
  id: string;
  orderRef: string;
  packageName: string;
  customerName: string;
  area: string;
  slotLabel: string;
  scheduledAt: string;
  status: BookingStatus | string;
  paymentMethod: PaymentMethod | string;
  subtotalPaise: number;
  itemCount: number;
  needsAction: boolean;
  vendorResponse: VendorResponse;
  primaryImageUrl: string | null;
};

export type VendorJobDetail = VendorJobSummary & {
  addressLine: string;
  customer: { name: string; phone: string };
  delivery: {
    address: string;
    landmark: string | null;
    cityName: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  };
  items: VendorJobItem[];
  canChat: boolean;
  deliveryCodeSent: boolean;
  collectionStatus: string;
  collectionMethod: string | null;
  requiresCollection: boolean;
  vendorSharePaise: number | null;
  platformFeePaise: number | null;
};

export type VendorJobsResponse = {
  items: VendorJobSummary[];
  total: number;
};

export type JobFilter = 'today' | 'upcoming' | 'completed' | 'action';
