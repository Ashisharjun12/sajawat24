import { useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  HomeIcon,
  LayoutGridIcon,
  ShoppingBagIcon,
  ZapIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { scrollToTop } from "@/lib/scroll-to-top";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";
import { toast } from "@/components/ui/toast";
import { useCategorySheetStore } from "@/store/category-sheet.store";

const TAB_COUNT = 5;

function WhatsAppNavIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

const ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon, kind: "home" },
  { id: "category", label: "Category", icon: LayoutGridIcon, kind: "category" },
  { id: "whatsapp", label: "WhatsApp", icon: WhatsAppNavIcon, kind: "whatsapp" },
  { id: "instant", label: "Instant", icon: ZapIcon, kind: "instant" },
  { id: "explore", label: "Explore", icon: ShoppingBagIcon, kind: "explore" },
];

function resolveActiveId(pathname, searchParams) {
  if (pathname === "/decorations" && searchParams.get("instant") === "1") {
    return "instant";
  }
  if (pathname === "/decorations" || pathname.startsWith("/c/")) {
    return "category";
  }
  if (pathname === "/explore") {
    return "explore";
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

  if (item.id === "whatsapp") {
    const waButton = (
      <>
        <span
          className="absolute -top-5 left-1/2 z-20 flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_16px_-4px] shadow-[#25D366]/50 ring-[3px] ring-background"
          aria-hidden
        >
          <WhatsAppNavIcon className="size-[1.15rem]" />
        </span>
        <span className="mt-4 max-w-full truncate px-0.5 text-[10px] font-semibold leading-none text-[#1DA851]">
          {item.label}
        </span>
      </>
    );

    return (
      <button
        type="button"
        className={shellClass}
        aria-label={item.label}
        onClick={() => onAction(item)}
      >
        {waButton}
      </button>
    );
  }

  const isInstant = item.id === "instant";

  const content = (
    <>
      <motion.span
        className="flex size-9 items-center justify-center"
        animate={{ y: active ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-out",
            isInstant
              ? active
                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                : "text-muted-foreground"
              : active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground",
          )}
        >
          <Icon
            className={cn("size-[1.25rem]", isInstant && active && "fill-orange-500/25")}
            strokeWidth={active ? 2.25 : 1.75}
            aria-hidden
          />
        </span>
      </motion.span>
      <span
        className={cn(
          "max-w-full truncate px-0.5 text-[10px] font-medium leading-none transition-colors duration-300",
          isInstant
            ? active
              ? "font-semibold text-orange-600 dark:text-orange-400"
              : "font-medium text-muted-foreground"
            : active
              ? "font-semibold text-primary"
              : "text-muted-foreground",
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

  const goExplore = useCallback(() => {
    navigate("/explore");
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

      if (item.kind === "explore") {
        goExplore();
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
    [brand.contactPhone, brand.whatsappUrl, goExplore, navigate, pathname, requestCategorySheet],
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
        className="overflow-visible rounded-t-2xl border-t border-border bg-background/95 pt-0.5 shadow-[0_-4px_24px_-8px] shadow-foreground/10 backdrop-blur-md"
      >
        <div className="relative flex w-full items-stretch overflow-visible">
          {hasActive ? (
            <motion.div
              className={cn(
                "pointer-events-none absolute top-0 z-10 h-1 w-12 -translate-x-1/2 rounded-full shadow-[0_0_14px_2px]",
                activeId === "instant"
                  ? "bg-orange-500 shadow-orange-500/35"
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
