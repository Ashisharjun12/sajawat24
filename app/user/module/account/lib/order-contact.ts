import type { PublicAssignee, PublicOrder, PublicServiceContact } from '@/api/orders.api';

export type OrderContactRow = {
  name: string;
  phone: string | null;
  subtitle: string;
  callLabel: string;
};

export type NormalizedOrderContacts = {
  primary: OrderContactRow;
  vendorSupport: OrderContactRow | null;
};

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

    return {
      primary: {
        name: serviceContact.name,
        phone: workerPhone,
        subtitle: serviceContact.shopName
          ? `Your decorator · ${serviceContact.shopName}`
          : 'Your decorator',
        callLabel: 'Call decorator',
      },
      vendorSupport: showVendorSupport
        ? {
            name: serviceContact.vendorName || serviceContact.shopName || 'Shop support',
            phone: vendorPhone,
            subtitle: 'Vendor support',
            callLabel: 'Call vendor',
          }
        : null,
    };
  }

  if (serviceContact?.name) {
    return {
      primary: {
        name: serviceContact.name,
        phone: serviceContact.phone,
        subtitle: serviceContact.kind === 'shop' ? 'Decoration partner' : 'Your decorator',
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
