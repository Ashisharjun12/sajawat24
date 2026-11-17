import { useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  HomeIcon,
  LayoutGridIcon,
  UserRoundIcon,
  ZapIcon,
} from "lucide-react";
import { motion } from "framer-motion";
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

function NavTab({ item, active, onAction }) {
  const Icon = item.icon;
  const shellClass =
    "relative flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 pb-2.5 pt-3 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring/50";

  const isInstant = item.id === "instant";
  const isWhatsApp = item.id === "whatsapp";

  const content = (
    <>
      <motion.span
        className="flex size-9 items-center justify-center"
        animate={{ y: active && !isWhatsApp ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-out",
            isWhatsApp
              ? "bg-[#25D366]/15 text-[#25D366]"
              : isInstant
                ? active
                  ? "bg-instant/15 text-instant"
                  : "text-muted-foreground"
                : active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
          )}
        >
          <Icon
            className={cn(
              "size-[1.25rem]",
              isInstant && active && "fill-instant/25",
            )}
            strokeWidth={isWhatsApp ? undefined : active ? 2.25 : 1.75}
            aria-hidden
          />
        </span>
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
  const indicatorLeft = hasActive ? ((activeIndex + 0.5) / TAB_COUNT) * 100 : 0;

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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 w-full md:hidden"
      aria-label="Primary"
    >
      <div
        className="rounded-t-2xl border-t border-border bg-background/95 pt-0.5 shadow-[0_-4px_24px_-8px] shadow-foreground/10 backdrop-blur-md"
      >
        <div className="relative flex w-full items-stretch">
          {hasActive ? (
            <motion.div
              className={cn(
                "pointer-events-none absolute top-0 z-10 h-1 w-12 -translate-x-1/2 rounded-full shadow-[0_0_14px_2px]",
                activeId === "instant"
                  ? "bg-instant shadow-instant/35"
                  : "bg-primary shadow-primary/30",
              )}
              initial={false}
              animate={{ left: `${indicatorLeft}%` }}
              transition={{ type: "spring", stiffness: 340, damping: 28, mass: 0.85 }}
              aria-hidden
            />
          ) : null}

          {ITEMS.map((item) => (
            <NavTab
              key={item.id}
              item={item}
              active={activeId === item.id}
              onAction={onAction}
            />
          ))}
        </div>
        <div
          className="h-[max(0.35rem,env(safe-area-inset-bottom))] w-full bg-background/95"
          aria-hidden
        />
      </div>
    </nav>
  );
}
