import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { UserRoundIcon } from "lucide-react";
import { DecoryLogo } from "@/components/decory-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/module/layout/components/CartButton";
import { MobileNav } from "@/module/layout/components/MobileNav";
import { SearchCommand } from "@/module/layout/components/SearchCommand";
import { UserMenu } from "@/module/layout/components/UserMenu";
import { NotificationBell } from "@/module/notifications/components/NotificationBell";
import { useAuthStore } from "@/store/auth.store";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";

function useIsMdDown() {
  return useSyncExternalStore(
    (listener) => {
      const mq = window.matchMedia(MD_DOWN_MEDIA_QUERY);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    },
    () => window.matchMedia(MD_DOWN_MEDIA_QUERY).matches,
    () => false,
  );
}

export function ProductPdpMobileHeader() {
  const isMdDown = useIsMdDown();
  const { brand } = useSiteShell();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const isLoggedIn = Boolean(user || accessToken);
  const companyName = brand.companyName || "Decoryy";

  if (!isMdDown) {
    return null;
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-sm md:hidden"
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <MobileNav triggerClassName="shrink-0" />
        <Link
          to="/"
          className="shrink-0"
          aria-label={`${companyName} home`}
        >
          <DecoryLogo
            className="size-8"
            lightSrc={brand.logoLightUrl}
            darkSrc={brand.logoDarkUrl}
            alt={companyName}
          />
        </Link>
        <div className="ml-auto flex shrink-0 items-center">
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
      </div>
    </header>
  );
}
