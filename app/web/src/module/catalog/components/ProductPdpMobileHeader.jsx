import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { UserRoundIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/module/layout/components/CartButton";
import { MobileNav } from "@/module/layout/components/MobileNav";
import { SearchCommand } from "@/module/layout/components/SearchCommand";
import { UserMenu } from "@/module/layout/components/UserMenu";
import { NotificationBell } from "@/module/notifications/components/NotificationBell";
import { useAuthStore } from "@/store/auth.store";

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";

const onBrandIcon =
  "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground";

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
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const isLoggedIn = Boolean(user || accessToken);

  if (!isMdDown) {
    return null;
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-primary-foreground/15 bg-primary text-primary-foreground shadow-sm md:hidden"
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <MobileNav triggerClassName={onBrandIcon} />
        <div className="min-w-0 flex-1" />
        <div className="ml-auto flex shrink-0 items-center">
          <SearchCommand variant="toolbarIcon" fullScreen className={onBrandIcon} />
          {isLoggedIn ? <NotificationBell className={onBrandIcon} /> : null}
          <CartButton className={onBrandIcon} />
          {isLoggedIn ? (
            user ? (
              <UserMenu variant="iconToolbar" className={onBrandIcon} />
            ) : (
              <Link
                to="/account"
                className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-primary-foreground/30"
                aria-label="Account"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary-foreground text-xs font-semibold text-primary">
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
              className={`size-9 shrink-0 ${onBrandIcon}`}
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
