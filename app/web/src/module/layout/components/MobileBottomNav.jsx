import { useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  HomeIcon,
  LayoutGridIcon,
  UserRoundIcon,
  ZapIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { scrollToTop } from "@/lib/scroll-to-top";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";
import { toast } from "@/components/ui/toast";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { useAuthStore } from "@/store/auth.store";
import { useCategorySheetStore } from "@/store/category-sheet.store";

const TAB_COUNT = 5;

const ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon, kind: "home" },
  { id: "category", label: "Category", icon: LayoutGridIcon, kind: "category" },
  { id: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, kind: "whatsapp" },
  { id: "instant", label: "Instant", icon: ZapIcon, kind: "instant" },
  { id: "account", label: "Account", icon: UserRoundIcon, kind: "account" },
];

function resolveActiveId(pathname, searchParams) {
  if (pathname === "/decorations" && searchParams.get("instant") === "1") {
    return "instant";
  }
  if (pathname === "/decorations" || pathname.startsWith("/c/")) {
    return "category";
  }
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    return "account";
  }
  if (pathname === "/") {
    return "home";
  }
  return null;
}

/** Tab switch timing (user app parity): 280ms ease-out cubic, no spring, no overshoot. */
const SLIDE_TRANSITION = { type: "tween", duration: 0.28, ease: [0.33, 1, 0.68, 1] };

function NavTab({ item, active, onAction, transition }) {
  const Icon = item.icon;
  const shellClass =
    "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const isInstant = item.id === "instant";
  const isWhatsApp = item.id === "whatsapp";

  const content = (
    <>
      {/* Smooth scale only (no lift, no bounce), same timing as the sliding highlight. */}
      <motion.span
        className={cn(
          "flex size-6 items-center justify-center transition-colors duration-300",
          isWhatsApp
            ? "text-[#25D366]"
            : active
              ? isInstant
                ? "text-instant"
                : "text-primary"
              : "text-muted-foreground",
        )}
        initial={false}
        animate={{ scale: active && !isWhatsApp ? 1.06 : 1 }}
        transition={transition}
      >
        <Icon
          className={cn(
            "size-[1.375rem]",
            isInstant && active && "fill-instant/25",
          )}
          strokeWidth={isWhatsApp ? undefined : active ? 2.25 : 1.75}
          aria-hidden
        />
      </motion.span>
      <span
        className={cn(
          "max-w-full truncate px-0.5 text-[10px] leading-none transition-colors duration-300",
          isWhatsApp
            ? "font-medium text-[#1DA851]"
            : isInstant
              ? active
                ? "font-semibold text-instant"
                : "font-medium text-muted-foreground"
              : active
                ? "font-semibold text-primary"
                : "font-medium text-muted-foreground",
        )}
      >
        {item.label}
      </span>
    </>
  );

  if (item.kind === "link") {
    return (
      <Link to={item.to} className={shellClass} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={shellClass}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      onClick={() => onAction(item)}
    >
      {content}
    </button>
  );
}

export function MobileBottomNav({ visible = true }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { brand } = useSiteShell();
  const categorySheetOpen = useCategorySheetStore((s) => s.open);
  const requestCategorySheet = useCategorySheetStore((s) => s.requestOpen);

  const activeId = useMemo(() => {
    if (categorySheetOpen) return "category";
    return resolveActiveId(pathname, searchParams);
  }, [categorySheetOpen, pathname, searchParams]);

  const activeIndex = ITEMS.findIndex((item) => item.id === activeId);
  const hasActive = activeIndex >= 0;
  const reduceMotion = useReducedMotion();
  const tabTransition = reduceMotion ? { duration: 0 } : SLIDE_TRANSITION;

  // Signed out: open the login dialog instead of /account (the account shell would bounce home).
  const goAccount = useCallback(() => {
    if (!useAuthStore.getState().user) {
      useAuthStore.getState().setLoginOpen(true);
      return;
    }
    navigate("/account");
  }, [navigate]);

  const onAction = useCallback(
    (item) => {
      if (item.kind === "home") {
        if (pathname === "/") {
          scrollToTop({ behavior: "smooth" });
          window.history.replaceState(null, "", "/");
          return;
        }
        navigate("/");
        return;
      }

      if (item.kind === "account") {
        goAccount();
        return;
      }

      if (item.kind === "instant") {
        navigate("/decorations?instant=1");
        return;
      }

      if (item.kind === "category") {
        requestCategorySheet();
        return;
      }

      if (item.kind === "whatsapp") {
        if (brand.whatsappUrl) {
          window.open(brand.whatsappUrl, "_blank", "noopener,noreferrer");
          return;
        }
        if (brand.contactPhone) {
          window.open(`tel:${brand.contactPhone}`, "_self");
          return;
        }
        toast.add({
          title: "WhatsApp is not available right now.",
          type: "error",
        });
      }
    },
    [brand.contactPhone, brand.whatsappUrl, goAccount, navigate, pathname, requestCategorySheet],
  );

  useEffect(() => {
    const offset = visible ? "4.75rem" : "0px";
    document.documentElement.style.setProperty("--mobile-bottom-nav-offset", offset);
    return () => {
      document.documentElement.style.setProperty("--mobile-bottom-nav-offset", "0px");
    };
  }, [visible]);

  if (!visible) return null;

  // Floating pill (user app parity): inset from the edges, soft shadow, one tinted highlight
  // that slides to the active tab. The gaps around the pill let taps reach the page.
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 w-full px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary"
    >
      <div className="pointer-events-auto h-[3.875rem] rounded-full border border-border/70 bg-card px-1.5 shadow-[0_4px_16px_rgb(0_0_0/0.12)]">
        <div className="relative flex h-full w-full items-stretch">
          {/* Highlight slot is one tab wide; translating it by 100% moves it one tab over. */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{ width: `${100 / TAB_COUNT}%` }}
            initial={false}
            animate={{
              x: `${(hasActive ? activeIndex : 0) * 100}%`,
              opacity: hasActive ? 1 : 0,
            }}
            transition={tabTransition}
            aria-hidden
          >
            <span
              className={cn(
                "absolute inset-x-[3px] inset-y-1.5 rounded-full transition-colors duration-300",
                activeId === "instant" ? "bg-instant/12" : "bg-primary/10",
              )}
            />
          </motion.div>

          {ITEMS.map((item) => (
            <NavTab
              key={item.id}
              item={item}
              active={activeId === item.id}
              onAction={onAction}
              transition={tabTransition}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
