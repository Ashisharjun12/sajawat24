import { Link } from "react-router-dom";
import { UserRoundIcon } from "lucide-react";
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

const onPrimaryIconClass =
  "size-9 shrink-0 rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground";

export function HomeMobileHero({ slides = [] }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const isLoggedIn = Boolean(user || accessToken);

  return (
    <section className="w-full md:hidden" aria-label="Home hero">
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div
          className="flex flex-col gap-2.5 px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
        >
          <div className="flex items-center gap-2 pt-2">
            <MobileNav
              triggerClassName="shrink-0 text-primary-foreground hover:bg-primary-foreground/15"
            />
            <div className="min-w-0 flex-1">
              <LocationPicker variant="onBrand" className="!max-w-none w-full" />
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
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

          <SearchCommand
            variant="pill"
            fullScreen
            className="h-11 w-full rounded-[var(--r-btn)] border border-black/10 bg-card shadow-sm"
          />
        </div>
      </div>

      {slides?.length ? (
        <div className="bg-background px-4 pt-2 pb-3">
          <BannerSlider slides={slides} variant="mobileHeroFull" />
        </div>
      ) : null}
    </section>
  );
}
