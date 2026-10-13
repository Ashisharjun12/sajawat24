import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { DecoryLogo } from "@/components/decory-logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { CategoryBar } from "@/module/catalog/components/CategoryBar";
import { CartButton } from "@/module/layout/components/CartButton";
import { WishlistButton } from "@/module/layout/components/WishlistButton";
import { LocationPicker } from "@/module/layout/components/LocationPicker";
import { MobileNav } from "@/module/layout/components/MobileNav";
import { SearchCommand } from "@/module/layout/components/SearchCommand";
import { SupportButton } from "@/module/layout/components/SupportButton";
import { UserMenu } from "@/module/layout/components/UserMenu";
import { NotificationBell } from "@/module/notifications/components/NotificationBell";
import { useAuthStore } from "@/store/auth.store";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";
import { isProductDetailPath } from "@/lib/product-page-route";

export function SiteHeader() {
  const { brand } = useSiteShell();
  const location = useLocation();
  const headerRef = useRef(null);
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const isAccount = location.pathname.startsWith("/account");
  const isCheckout = location.pathname.startsWith("/checkout");
  const isHome = location.pathname === "/";
  const isProductPdp = isProductDetailPath(location.pathname);

  useMotionValueEvent(scrollY, "change", (value) => {
    setCompact(value > 24);
  });

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${el.offsetHeight}px`,
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50",
        (isHome || isProductPdp) && "hidden md:block",
      )}
    >
      <div
        className="border-b border-primary-foreground/15 bg-primary text-primary-foreground shadow-sm"
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1240px] items-center gap-3 px-4 transition-[padding] duration-200 md:gap-4 md:px-8",
            compact ? "py-2" : "pt-4 pb-3",
          )}
        >
        <MobileNav
          triggerClassName="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
        />
        <Link
          to="/"
          className="hidden shrink-0 items-center md:flex"
          aria-label={`${brand.companyName} home`}
        >
          <DecoryLogo
            variant="wordmark"
            className="h-8 sm:h-9"
            alt={brand.companyName}
          />
        </Link>
        <div className="min-w-0 flex-1 md:hidden">
          <LocationPicker variant="onBrand" className="h-9 w-full max-w-full" />
        </div>
        <div className="hidden min-w-0 md:block md:flex-none">
          <LocationPicker variant="onBrand" />
        </div>
        <div className="mx-auto hidden min-w-0 max-w-[340px] flex-1 md:block">
          <SearchCommand
            className="border-black/10 shadow-sm"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <SearchCommand
            variant="icon"
            className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
          />
          <SupportButton className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
          {user ? (
            <NotificationBell className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
          ) : null}
          <WishlistButton className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
          <CartButton className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
          {user ? (
            <>
              <UserMenu className="md:hidden" />
              <UserMenu
                variant="iconBrand"
                className="hidden ring-primary-foreground/25 md:inline-flex"
              />
            </>
          ) : (
            <Button
              size="sm"
              className="hidden h-10 px-4 sm:inline-flex md:border-primary-foreground/25 md:bg-primary-foreground md:text-primary md:hover:bg-primary-foreground/90"
              onClick={() => setLoginOpen(true)}
            >
              Sign in
            </Button>
          )}
          <ModeToggle
            className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/15"
          />
        </div>
        </div>
      </div>
      {!isAccount && !isCheckout ? (
        <div
          className={cn(
            "hidden overflow-hidden border-b border-border bg-background transition-[max-height,opacity] duration-200 md:block",
            compact ? "max-h-0 border-b-0 opacity-0" : "max-h-24 opacity-100",
          )}
        >
          <div className="mx-auto max-w-[1240px] px-4 md:px-8">
            <CategoryBar />
          </div>
        </div>
      ) : null}
    </header>
  );
}
