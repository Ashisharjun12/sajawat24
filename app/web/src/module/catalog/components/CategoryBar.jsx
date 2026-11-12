import { Link, useLocation } from "react-router-dom";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { LayoutGridIcon } from "lucide-react";
import { categoryPath } from "@/lib/catalog-path";
import {
  categoryIconUrl,
  listTopLevelCategories,
  resolveCategoryIcon,
} from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { useCatalogStore } from "@/store/catalog.store";

const VISIBLE_COUNT = 8;

function CategoryLink({ category, active, layoutId, onPrimary }) {
  const { Icon, iconBg, iconUrl } = resolveCategoryIcon({
    iconKey: category.iconKey,
    iconTone: category.iconTone,
    iconUrl: categoryIconUrl(category),
    slug: category.slug,
  });
  const href = categoryPath(category);

  return (
    <Link
      to={href}
      className={cn(
        "relative flex shrink-0 flex-col items-center gap-1 px-3.5 pt-1 pb-2 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100",
        active && "opacity-100",
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-xl",
          iconBg,
        )}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            width={32}
            height={32}
            decoding="async"
            className="size-8 object-contain"
          />
        ) : (
          <Icon className="size-4" strokeWidth={1.75} />
        )}
      </span>
      <span className="whitespace-nowrap">{category.name}</span>
      {active ? (
        <motion.span
          layoutId={layoutId}
          className={cn(
            "absolute inset-x-3 bottom-0 h-0.5 rounded-full",
            onPrimary ? "bg-primary-foreground" : "bg-foreground",
          )}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      ) : null}
    </Link>
  );
}

export function CategoryBar({ onPrimary = false }) {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const status = useCatalogStore((s) => s.status);
  const categories = useCatalogStore((s) => s.categories);
  const topLevel = listTopLevelCategories(categories);
  const visible = topLevel.slice(0, VISIBLE_COUNT);
  const showViewAll = topLevel.length > VISIBLE_COUNT;
  const layoutId = reduceMotion ? undefined : "cat-underline";
  const decorationsActive = location.pathname === "/decorations";

  if (status !== "ready" || topLevel.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <LayoutGroup id="cat-bar">
        {visible.map((category) => {
          const href = categoryPath(category);
          const active =
            location.pathname === href ||
            location.pathname.startsWith(`${href}/`);
          return (
            <CategoryLink
              key={category.id}
              category={category}
              active={active}
              layoutId={layoutId}
              onPrimary={onPrimary}
            />
          );
        })}
      </LayoutGroup>
      {showViewAll ? (
        <Link
          to="/decorations"
          className={cn(
            "relative flex shrink-0 flex-col items-center gap-1 px-3.5 pt-1 pb-2 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100",
            decorationsActive && "opacity-100",
          )}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-xl",
              decorationsActive
                ? onPrimary
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/15 text-primary"
                : onPrimary
                  ? "bg-primary-foreground/10 text-primary-foreground/80"
                  : "bg-muted/80 text-foreground/70",
            )}
          >
            <LayoutGridIcon className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="whitespace-nowrap">View all</span>
          {decorationsActive ? (
            <motion.span
              layoutId={layoutId}
              className={cn(
                "absolute inset-x-3 bottom-0 h-0.5 rounded-full",
                onPrimary ? "bg-primary-foreground" : "bg-foreground",
              )}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          ) : null}
        </Link>
      ) : null}
    </div>
  );
}
