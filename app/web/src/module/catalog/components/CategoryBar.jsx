import { Link, useLocation } from "react-router-dom";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";
import { categoryPath } from "@/lib/catalog-path";
import {
  listTopLevelCategories,
  resolveCategoryIcon,
} from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCatalogStore } from "@/store/catalog.store";

const VISIBLE_COUNT = 8;

function CategoryLink({ category, active, layoutId }) {
  const { Icon, iconBg } = resolveCategoryIcon({
    iconKey: category.iconKey,
    iconTone: category.iconTone,
    slug: category.slug,
  });
  const href = categoryPath(category);

  return (
    <Link
      to={href}
      className={cn(
        "relative flex shrink-0 flex-col items-center gap-1.5 px-3.5 pt-1.5 pb-3 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100",
        active && "opacity-100",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          iconBg,
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <span className="whitespace-nowrap">{category.name}</span>
      {active ? (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      ) : null}
    </Link>
  );
}

export function CategoryBar() {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const status = useCatalogStore((s) => s.status);
  const categories = useCatalogStore((s) => s.categories);
  const topLevel = listTopLevelCategories(categories);
  const visible = topLevel.slice(0, VISIBLE_COUNT);
  const overflow = topLevel.slice(VISIBLE_COUNT);
  const layoutId = reduceMotion ? undefined : "cat-underline";

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
            />
          );
        })}
      </LayoutGroup>
      {overflow.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] font-bold transition-shadow hover:shadow-sm"
          >
            More
            <ChevronDownIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {overflow.map((category) => {
              const { Icon, iconBg } = resolveCategoryIcon({
                iconKey: category.iconKey,
                iconTone: category.iconTone,
                slug: category.slug,
              });
              return (
                <DropdownMenuItem
                  key={category.id}
                  className="cursor-pointer"
                  render={<Link to={categoryPath(category)} />}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      iconBg,
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </span>
                  {category.name}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
