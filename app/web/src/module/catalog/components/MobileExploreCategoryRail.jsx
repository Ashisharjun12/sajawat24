import { Link, useSearchParams } from "react-router-dom";
import {
  listTopLevelCategories,
  resolveCategoryIcon,
} from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { parseCategoryIdsParam } from "@/module/catalog/lib/explore-category-filter";

export function MobileExploreCategoryRail({ categories = [] }) {
  const [searchParams] = useSearchParams();
  const selected = parseCategoryIdsParam(searchParams);
  const activeSingle = selected.length === 1 ? selected[0] : null;
  const topLevel = listTopLevelCategories(categories);

  const allActive = selected.length === 0;

  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 pb-2.5 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Browse by category"
    >
      <Link
        to="/explore"
        className={cn(
          "inline-flex shrink-0 items-center rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
          allActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        All
      </Link>
      {topLevel.map((category) => {
        const active = activeSingle === category.id;
        const { Icon, iconBg } = resolveCategoryIcon({
          iconKey: category.iconKey,
          iconTone: category.iconTone,
          slug: category.slug,
        });
        return (
          <Link
            key={category.id}
            to={`/explore?categoryId=${encodeURIComponent(category.id)}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full py-2 pr-3.5 pl-2 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                active ? "bg-primary-foreground/15" : iconBg,
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.85} aria-hidden />
            </span>
            <span className="whitespace-nowrap">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
