import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getLenis } from "@/lib/lenis-instance";
import { AccountNav } from "@/module/account/components/AccountNav";
import { CustomerAuthGate } from "@/module/auth/components/CustomerAuthGate";
import { cn } from "@/lib/utils";

function isAccountChatRoute(pathname) {
  return (
    pathname.includes("/chat") ||
    /\/account\/help\/[^/]+\/chat$/.test(pathname)
  );
}

/** Booking details draws its own mobile header and full-bleed map (user-app layout). */
function isBookingDetailRoute(pathname) {
  return /^\/account\/bookings\/[^/]+\/?$/.test(pathname);
}

/** /account index: on phones it is the user app Account tab, which already lists every page. */
function isAccountHomeRoute(pathname) {
  return /^\/account\/?$/.test(pathname);
}

export function AccountShell() {
  const { pathname } = useLocation();
  const isChat = isAccountChatRoute(pathname);
  const isBookingDetail = isBookingDetailRoute(pathname);
  const isAccountHome = isAccountHomeRoute(pathname);

  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, []);

  return (
    <CustomerAuthGate mode="redirect">
    <div className="flex h-[calc(100dvh-var(--site-header-height,4rem))] min-h-0 overflow-hidden">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-background md:flex lg:w-64">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-8"
          data-lenis-prevent
        >
          <AccountNav variant="sidebar" />
        </div>
      </aside>

      {/* Phones have no tab strip: the /account page (user app Account tab) links to every page. */}
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
        <div
          className={cn(
            "min-h-0 flex-1",
            isChat
              ? "overflow-hidden"
              : isBookingDetail
                ? "overflow-y-auto overscroll-contain md:px-6 md:py-8 lg:px-12 lg:py-10"
                : isAccountHome
                  ? "overflow-y-auto overscroll-contain bg-muted/30 px-4 pt-3 md:bg-transparent md:px-6 md:py-8 lg:px-12 lg:py-10"
                  : "overflow-y-auto overscroll-contain px-6 py-8 lg:px-12 lg:py-10",
          )}
          data-lenis-prevent
        >
          <Outlet />
        </div>
      </div>
    </div>
    </CustomerAuthGate>
  );
}
