import type { PublicAssignee, PublicOrder, PublicServiceContact } from '@/api/orders.api';

export type OrderContactRow = {
  name: string;
  phone: string | null;
  /** Full one-line description (role · shop), e.g. for accessibility labels. */
  subtitle: string;
  /** Short role label shown above the name, e.g. "Your decorator". */
  role: string;
  /** Extra line under the name (shop name), or null. */
  detail: string | null;
  callLabel: string;
};

export type NormalizedOrderContacts = {
  primary: OrderContactRow;
  vendorSupport: OrderContactRow | null;
};

function joinSubtitle(role: string, detail: string | null): string {
  return detail ? `${role} · ${detail}` : role;
}

function normalizeContacts(input: {
  serviceContact?: PublicServiceContact | null;
  assignee?: PublicAssignee | null;
}): NormalizedOrderContacts | null {
  const { serviceContact, assignee } = input;
  if (serviceContact?.kind === 'worker' && serviceContact.name) {
    const vendorPhone = serviceContact.vendorPhone?.trim() || null;
    const workerPhone = serviceContact.phone?.trim() || null;
    const showVendorSupport =
      vendorPhone &&
      (!workerPhone || vendorPhone.replace(/\D/g, '') !== workerPhone.replace(/\D/g, ''));
    const shop = serviceContact.shopName?.trim() || null;
    const role = 'Your decorator';
    return {
      primary: {
        name: serviceContact.name,
        phone: workerPhone,
        subtitle: joinSubtitle(role, shop),
        role,
        detail: shop,
        callLabel: 'Call decorator',
      },
      vendorSupport: showVendorSupport
        ? {
            name: serviceContact.vendorName || serviceContact.shopName || 'Shop support',
            phone: vendorPhone,
            subtitle: 'Vendor support',
            role: 'Vendor support',
            detail: null,
            callLabel: 'Call vendor',
          }
        : null,
    };
  }
  if (serviceContact?.name) {
    const role = serviceContact.kind === 'shop' ? 'Decoration partner' : 'Your decorator';
    return {
      primary: {
        name: serviceContact.name,
        phone: serviceContact.phone,
        subtitle: role,
        role,
        detail: null,
        callLabel: 'Call',
      },
      vendorSupport: null,
    };
  }
  if (assignee) {
    return {
      primary: {
        name: assignee.name,
        phone: assignee.phone,
        subtitle: 'Your decorator',
        role: 'Your decorator',
        detail: null,
        callLabel: 'Call',
      },
      vendorSupport: null,
    };
  }
  return null;
}

export function getOrderContacts(order: PublicOrder): NormalizedOrderContacts | null {
  return normalizeContacts({
    serviceContact: order.serviceContact,
    assignee: order.assignee,
  });
}

export function shouldShowOrderContactCard(order: PublicOrder): boolean {
  if (order.status === 'CANCELLED') return false;
  const vendorAccepted = order.assignee?.vendorResponse === 'accepted';
  if (order.status === 'COMPLETED') {
    return Boolean(order.serviceContact);
  }
  return vendorAccepted && Boolean(getOrderContacts(order));
}

export function canChatWithVendor(order: PublicOrder): boolean {
  const vendorAccepted = order.assignee?.vendorResponse === 'accepted';
  return (
    vendorAccepted &&
    order.status !== 'CANCELLED' &&
    order.status !== 'COMPLETED' &&
    order.status !== 'PENDING_PAYMENT'
  );
}
