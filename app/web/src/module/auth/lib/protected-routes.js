/**
 * Customer routes that require login (see App.jsx + CustomerAuthGate / AccountShell).
 *
 * Public: home, catalog, product, cities, offers, CMS, bag redirect.
 * Auth (AccountShell): /account/*
 * Auth (CustomerAuthGate prompt): /checkout, /checkout/success/:orderId
 */

export const CUSTOMER_AUTH_PROMPT_PATHS = ["/checkout", "/checkout/success"];

export function isCustomerAuthPromptPath(pathname) {
  if (pathname === "/checkout") return true;
  return pathname.startsWith("/checkout/success/");
}
