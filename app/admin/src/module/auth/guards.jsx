import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth.store";
import {
  ADMIN_ACCOUNT_SETUP_PATH,
  adminHomePath,
  adminNeedsSetup,
  isAdminAccountSetupRoute,
} from "@/module/auth/admin-setup";

function FullPageSpinner() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}

export function RequireAdmin() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Blocks dashboard and other routes until first-time account setup is finished. */
export function RequireAdminSetupComplete() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  if (!adminNeedsSetup(user)) {
    return <Outlet />;
  }

  if (isAdminAccountSetupRoute(pathname, searchParams)) {
    return <Outlet />;
  }

  return <Navigate to={ADMIN_ACCOUNT_SETUP_PATH} replace />;
}

export function AdminHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={adminHomePath(user)} replace />;
}

export function GuestOnly() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner />;
  }

  if (user?.role === "admin") {
    return <Navigate to={adminHomePath(user)} replace />;
  }

  return <Outlet />;
}
