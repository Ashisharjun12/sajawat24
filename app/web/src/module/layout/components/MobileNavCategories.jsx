import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { categoryPath } from "@/lib/catalog-path";
import { cn } from "@/lib/utils";

const rowClass =
  "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-muted active:bg-muted";

function sortedChildren(category) {
  const rows = Array.isArray(category?.children) ? category.children : [];
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Mobile menu categories as a text list. A category with subcategories slides the
 * panel sideways to its sub-list (with Back + "All {name}"); others link straight to the listing.
 */
export function MobileNavCategories({ categories, onNavigate }) {
  const [active, setActive] = useState(null);
  const children = sortedChildren(active);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className={cn(
          "flex h-full w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none",
          active ? "-translate-x-1/2" : "translate-x-0",
        )}
      >
        {/* Panel 1: top-level categories */}
        <div
          className="h-full w-1/2 overflow-y-auto overscroll-contain px-2 py-3"
          data-lenis-prevent
          aria-hidden={active ? true : undefined}
          inert={active ? true : undefined}
        >
          <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">Categories</p>
          <nav aria-label="Categories">
            <ul className="divide-y divide-border/60">
              {categories.map((category) => {
                const hasChildren = sortedChildren(category).length > 0;
                return (
                  <li key={category.id}>
                    {hasChildren ? (
                      <button
                        type="button"
                        className={rowClass}
                        onClick={() => setActive(category)}
                        aria-label={`${category.name}, show subcategories`}
                      >
                        <span className="min-w-0 truncate">{category.name}</span>
                        <ChevronRightIcon
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <Link
                        to={categoryPath(category)}
                        className={rowClass}
                        onClick={() => onNavigate?.()}
                      >
                        <span className="min-w-0 truncate">{category.name}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Panel 2: subcategories of the tapped category */}
        <div
          className="h-full w-1/2 overflow-y-auto overscroll-contain px-2 py-3"
          data-lenis-prevent
          aria-hidden={active ? undefined : true}
          inert={active ? undefined : true}
        >
          {active ? (
            <>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="mb-1 flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeftIcon className="size-4" aria-hidden />
                All categories
              </button>
              <p className="px-3 pb-2 pt-1 font-heading text-base font-semibold text-foreground">
                {active.name}
              </p>
              <nav aria-label={`${active.name} subcategories`}>
                <ul className="divide-y divide-border/60">
                  <li>
                    <Link
                      to={categoryPath(active)}
                      className={cn(rowClass, "text-primary")}
                      onClick={() => onNavigate?.()}
                    >
                      <span className="min-w-0 truncate">All {active.name}</span>
                      <ChevronRightIcon className="size-4 shrink-0" aria-hidden />
                    </Link>
                  </li>
                  {children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={categoryPath(active, child)}
                        className={rowClass}
                        onClick={() => onNavigate?.()}
                      >
                        <span className="min-w-0 truncate">{child.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
