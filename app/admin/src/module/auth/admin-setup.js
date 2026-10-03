export const ADMIN_ACCOUNT_SETUP_PATH = "/settings?tab=account";

export function adminNeedsSetup(user) {
  return Boolean(user?.role === "admin" && user?.mustChangePassword);
}

export function adminHomePath(user) {
  return adminNeedsSetup(user) ? ADMIN_ACCOUNT_SETUP_PATH : "/dashboard";
}

/** Dev default: allow skipping env bootstrap password. Set VITE_ALLOW_SKIP_ADMIN_SETUP=false in prod builds if needed. */
export function allowSkipAdminPasswordSetup() {
  const flag = import.meta.env.VITE_ALLOW_SKIP_ADMIN_PASSWORD_SETUP?.trim();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !import.meta.env.PROD;
}

export function isAdminAccountSetupRoute(pathname, searchParams) {
  if (pathname !== "/settings") return false;
  const tab = searchParams.get("tab");
  return !tab || tab === "account";
}
