import { Link } from "react-router-dom";
import { UserRoundIcon } from "lucide-react";
import { DecoryLogo } from "@/components/decory-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BannerSlider } from "@/module/home/components/BannerSlider";
import { CartButton } from "@/module/layout/components/CartButton";
import { LocationPicker } from "@/module/layout/components/LocationPicker";
import { MobileNav } from "@/module/layout/components/MobileNav";
import { SearchCommand } from "@/module/layout/components/SearchCommand";
import { UserMenu } from "@/module/layout/components/UserMenu";
import { NotificationBell } from "@/module/notifications/components/NotificationBell";
import { useAuthStore } from "@/store/auth.store";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";

export function HomeMobileHero({ slides = [] }) {
  const { brand } = useSiteShell();
  const companyName = brand.companyName || "Decoryy";
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const isLoggedIn = Boolean(user || accessToken);

  return (
    <section className="w-full bg-background md:hidden" aria-label="Home hero">
      <div
        className="sticky top-0 z-40 flex items-center gap-1 border-b border-border/70 bg-background/95 px-3 py-2 backdrop-blur-sm"
      >
        <MobileNav triggerClassName="shrink-0" />
        <Link to="/" className="shrink-0" aria-label={`${companyName} home`}>
          <DecoryLogo
            className="size-8"
            lightSrc={brand.logoLightUrl}
            darkSrc={brand.logoDarkUrl}
            alt={companyName}
          />
        </Link>
        <div className="min-w-0 flex-1 px-1">
          <LocationPicker variant="mobileToolbar" />
        </div>
        <SearchCommand variant="toolbarIcon" fullScreen />
        {isLoggedIn ? <NotificationBell /> : null}
        <CartButton />
        {isLoggedIn ? (
          user ? (
            <UserMenu variant="iconToolbar" />
          ) : (
            <Link
              to="/account"
              className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border"
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
            className="size-9 shrink-0"
            onClick={() => setLoginOpen(true)}
            aria-label="Sign in"
          >
            <UserRoundIcon className="size-5" />
          </Button>
        )}
      </div>

      {slides?.length ? (
        <div className="px-4 pt-2 pb-3">
          <BannerSlider slides={slides} variant="mobileHeroFull" />
        </div>
      ) : null}
    </section>
  );
}
