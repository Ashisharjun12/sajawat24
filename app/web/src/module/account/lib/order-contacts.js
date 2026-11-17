function joinSubtitle(role, detail) {
  return detail ? `${role} · ${detail}` : role;
}

/**
 * Who the customer can call for a booking: the decorator, plus vendor support when different.
 * Each row has `role` (small label above the name), `detail` (shop name line, or null) and
 * `subtitle` (role · detail, one line) — same shape as the user app `order-contact.ts`.
 */
export function normalizeContacts({ serviceContact, assignee }) {
  if (serviceContact?.kind === "worker" && serviceContact.name) {
    const vendorPhone = serviceContact.vendorPhone?.trim() || null;
    const workerPhone = serviceContact.phone?.trim() || null;
    const showVendorSupport =
      vendorPhone && (!workerPhone || vendorPhone.replace(/\D/g, "") !== workerPhone.replace(/\D/g, ""));
    const shop = serviceContact.shopName?.trim() || null;
    const role = "Your decorator";

    return {
      primary: {
        name: serviceContact.name,
        phone: workerPhone,
        role,
        detail: shop,
        subtitle: joinSubtitle(role, shop),
        callLabel: "Call decorator",
      },
      vendorSupport: showVendorSupport
        ? {
            name: serviceContact.vendorName || serviceContact.shopName || "Shop support",
            phone: vendorPhone,
            role: "Vendor support",
            detail: null,
            subtitle: "Vendor support",
            callLabel: "Call vendor",
          }
        : null,
    };
  }

  if (serviceContact?.name) {
    const role = serviceContact.kind === "shop" ? "Decoration partner" : "Your decorator";
    return {
      primary: {
        name: serviceContact.name,
        phone: serviceContact.phone,
        role,
        detail: null,
        subtitle: role,
        callLabel: "Call",
      },
      vendorSupport: null,
    };
  }

  if (assignee) {
    return {
      primary: {
        name: assignee.name,
        phone: assignee.phone,
        role: "Your decorator",
        detail: null,
        subtitle: "Your decorator",
        callLabel: "Call",
      },
      vendorSupport: null,
    };
  }

  return null;
}
