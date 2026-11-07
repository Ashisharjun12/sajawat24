import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BellIcon, UserRoundIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BannerSlider } from "@/module/home/components/BannerSlider";
import { CartButton } from "@/module/layout/components/CartButton";
import { LocationPicker } from "@/module/layout/components/LocationPicker";
import { MobileNav } from "@/module/layout/components/MobileNav";
import { SearchCommand } from "@/module/layout/components/SearchCommand";
import { UserMenu } from "@/module/layout/components/UserMenu";
import { WishlistButton } from "@/module/layout/components/WishlistButton";
import { NotificationBell } from "@/module/notifications/components/NotificationBell";
import { useAuthStore } from "@/store/auth.store";

// Same look as the user app header buttons: translucent white circle with a thin border.
const onPrimaryIconClass =
  "size-9 shrink-0 rounded-full border border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground";

// Bell next to the pinned search bar: 40px circle, like the app's header buttons.
const pinnedBellClass = cn(onPrimaryIconClass, "size-10");

// Location shown as a pill, like the user app.
const locationPillClass =
  "h-auto w-auto max-w-full rounded-full border border-primary-foreground/25 bg-black/15 px-3 py-2 hover:border-primary-foreground/25 hover:bg-black/25";

// Search bar is pulled up this far, so its middle sits on the banner's bottom edge
// (row pt-2 = 8px + half of the 48px bar = 32px). Matches HOME_SEARCH_BANNER_OVERLAP in the app.
const SEARCH_BANNER_OVERLAP = 32;
// Banner dots sit just above the part of the bar that covers the banner.
const BANNER_DOTS_BOTTOM = SEARCH_BANNER_OVERLAP - 8 + 10;

const SEARCH_ROW_CLASS = "px-4 pt-2 pb-2.5";
const SEARCH_BAR_CLASS =
  "h-12 w-full gap-2.5 rounded-[12px] border border-black/10 bg-card px-3.5 text-sm shadow-[0_4px_12px_rgba(15,23,42,0.05)] [&>svg]:size-5";

export function HomeMobileHero({ slides = [] }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const isLoggedIn = Boolean(user || accessToken);
  const hasBanner = Boolean(slides?.length);

  // Pin a copy of the search bar to the top once the in-page bar scrolls past it.
  const searchRowRef = useRef(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = searchRowRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full md:hidden" aria-label="Home hero">
      <div className="bg-primary text-primary-foreground">
        <div className="px-3 pb-3.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 pt-2">
            <MobileNav
              triggerClassName="shrink-0 text-primary-foreground hover:bg-primary-foreground/15"
            />
            <div className="flex min-w-0 flex-1">
              <LocationPicker variant="onBrand" className={locationPillClass} />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <WishlistButton className={onPrimaryIconClass} />
              {isLoggedIn ? (
                <NotificationBell className={onPrimaryIconClass} />
              ) : null}
              <CartButton className={onPrimaryIconClass} />
              {isLoggedIn ? (
                user ? (
                  <UserMenu
                    variant="iconToolbar"
                    className="ring-primary-foreground/25"
                  />
                ) : (
                  <Link
                    to="/account"
                    className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-primary-foreground/25"
                    aria-label="Account"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                        U
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={onPrimaryIconClass}
                  onClick={() => setLoginOpen(true)}
                  aria-label="Sign in"
                >
                  <UserRoundIcon className="size-5" />
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {hasBanner ? (
        <BannerSlider
          slides={slides}
          variant="mobileHeroFull"
          dotsBottom={BANNER_DOTS_BOTTOM}
        />
      ) : null}

      {/* Floats over the banner's bottom edge; solid green when there is no banner. */}
      <div
        ref={searchRowRef}
        className={cn("relative z-10", SEARCH_ROW_CLASS, !hasBanner && "bg-primary")}
        style={hasBanner ? { marginTop: -SEARCH_BANNER_OVERLAP } : undefined}
      >
        <SearchCommand variant="pill" fullScreen className={SEARCH_BAR_CLASS} />
      </div>

      <div
        className={cn(
          "fixed inset-x-0 top-0 z-40 bg-primary shadow-md transition-opacity duration-150",
          SEARCH_ROW_CLASS,
          "pt-[max(0.5rem,env(safe-area-inset-top))]",
          pinned ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!pinned}
        inert={!pinned ? true : undefined}
      >
        {/* Same as the user app: pinned search bar with the bell at its right end. */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchCommand variant="pill" fullScreen className={SEARCH_BAR_CLASS} />
          </div>
          {isLoggedIn ? (
            <NotificationBell className={pinnedBellClass} />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={pinnedBellClass}
              onClick={() => setLoginOpen(true)}
              aria-label="Notifications"
            >
              <BellIcon className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
