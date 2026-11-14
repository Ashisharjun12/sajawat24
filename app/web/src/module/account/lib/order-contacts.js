/** Who the customer can call for a booking: the decorator, plus vendor support when different. */
export function normalizeContacts({ serviceContact, assignee }) {
  if (serviceContact?.kind === "worker" && serviceContact.name) {
    const vendorPhone = serviceContact.vendorPhone?.trim() || null;
    const workerPhone = serviceContact.phone?.trim() || null;
    const showVendorSupport =
      vendorPhone && (!workerPhone || vendorPhone.replace(/\D/g, "") !== workerPhone.replace(/\D/g, ""));

    return {
      primary: {
        name: serviceContact.name,
        phone: workerPhone,
        subtitle:
          serviceContact.shopName
            ? `Your decorator on the way · ${serviceContact.shopName}`
            : "Your decorator on the way",
        callLabel: "Call decorator",
      },
      vendorSupport: showVendorSupport
        ? {
            name: serviceContact.vendorName || serviceContact.shopName || "Shop support",
            phone: vendorPhone,
            subtitle: "Vendor support",
            callLabel: "Call vendor",
          }
        : null,
    };
  }

  if (serviceContact?.name) {
    const subtitle =
      serviceContact.kind === "shop" ? "Decoration partner" : "Your decorator";
    return {
      primary: {
        name: serviceContact.name,
        phone: serviceContact.phone,
        subtitle,
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
        subtitle: "Your decorator",
        callLabel: "Call",
      },
      vendorSupport: null,
    };
  }

  return null;
}
