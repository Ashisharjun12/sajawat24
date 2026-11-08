import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LenisProvider } from "@/lib/lenis";
import { LoginDialog } from "@/module/layout/components/LoginDialog";
import { LocationPrompt } from "@/module/layout/components/LocationPrompt";
import { CartDrawer } from "@/module/layout/components/CartDrawer";
import { SiteFooter } from "@/module/layout/components/SiteFooter";
import { SiteShellProvider } from "@/module/site/hooks/use-site-shell.jsx";
import { AnnouncementBar } from "@/module/cms/components/AnnouncementBar";
import { SiteHeader } from "@/module/layout/components/SiteHeader";
import { ScrollToTopButton } from "@/module/layout/components/ScrollToTopButton";
import { ScrollToTopOnNavigate } from "@/module/layout/components/ScrollToTopOnNavigate";
import { MobileBottomNav } from "@/module/layout/components/MobileBottomNav";
import { MobileCategorySheet } from "@/module/layout/components/MobileCategorySheet";
import { MerchSectionsSync } from "@/module/layout/components/MerchSectionsSync";
import { RouteSeo } from "@/module/layout/components/RouteSeo";
import { isProductDetailPath } from "@/lib/product-page-route";

export function Layout() {
  const { pathname } = useLocation();
  const isAccountArea = pathname.startsWith("/account");
  const isCheckoutArea = pathname.startsWith("/checkout");
  const isProductPdp = isProductDetailPath(pathname);
  const showFooter = !isAccountArea && !isCheckoutArea;
  const showMobileBottomNav = !isCheckoutArea && !isProductPdp;

  return (
    <LenisProvider>
      <TooltipProvider>
        <SiteShellProvider>
        <Toaster>
          <RouteSeo />
          <ScrollToTopOnNavigate />
          <MerchSectionsSync />
          <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
            <AnnouncementBar />
            <SiteHeader />
            <LocationPrompt />
            <main
              className={
                isAccountArea
                  ? "flex min-h-0 flex-1 flex-col max-md:pb-[calc(var(--mobile-bottom-nav-offset,0px)+0.25rem)]"
                  : "flex-1 max-md:pb-[calc(var(--mobile-bottom-nav-offset,0px)+0.25rem)]"
              }
            >
              <Outlet />
            </main>
            {showFooter ? <SiteFooter /> : null}
            <MobileBottomNav visible={showMobileBottomNav} />
            <MobileCategorySheet />
            <LoginDialog />
            <CartDrawer />
            {showFooter ? <ScrollToTopButton /> : null}
          </div>
        </Toaster>
        </SiteShellProvider>
      </TooltipProvider>
    </LenisProvider>
  );
}
