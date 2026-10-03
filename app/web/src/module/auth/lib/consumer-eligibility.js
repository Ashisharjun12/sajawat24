const CONSUMER_ROLES = new Set(["user", "vendor", "vendor_staff"]);

export function isConsumerAppEligible(user) {
  const role = user?.role;
  return role != null && CONSUMER_ROLES.has(role);
}

/** @deprecated Use isConsumerAppEligible */
export function isCustomer(user) {
  return isConsumerAppEligible(user);
}

export function consumerSessionErrorMessage(err) {
  const code = err?.response?.data?.code;
  if (code === "USE_ADMIN_PORTAL") {
    return "Use the admin portal to sign in with this account.";
  }
  if (code === "CONSUMER_APP_FORBIDDEN") {
    return "This account cannot use the customer app.";
  }
  const message = err?.response?.data?.message || err?.message;
  if (typeof message === "string" && message.toLowerCase().includes("account blocked")) {
    return "This account has been blocked. Contact support if you need help.";
  }
  return message || "Could not sign in.";
}
