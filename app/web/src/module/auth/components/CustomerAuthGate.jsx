import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

/**
 * Protects customer-only routes (checkout, order confirmation, account).
 *
 * - redirect (default): open login, send user home — used by account shell.
 * - prompt: stay on URL, show sign-in CTA — used after checkout so login can return to same path.
 */
export function CustomerAuthGate({
  mode = "redirect",
  title = "Sign in to continue",
  description = "Use the login dialog to access this page.",
  children,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);

  useEffect(() => {
    if (status !== "ready" || user) return;
    setLoginOpen(true);
    if (mode === "redirect") {
      navigate("/", { replace: true });
    }
  }, [status, user, mode, navigate, setLoginOpen]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!user) {
    if (mode === "redirect") {
      return (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 px-6 py-12 lg:px-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button type="button" onClick={() => setLoginOpen(true)}>
          Sign in
        </Button>
        {pathname.startsWith("/checkout/success") ? (
          <p className="text-xs text-muted-foreground">
            After signing in, this page will load your booking confirmation.
          </p>
        ) : null}
      </div>
    );
  }

  return children;
}
