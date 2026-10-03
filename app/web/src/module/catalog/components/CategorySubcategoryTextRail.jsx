import { Link } from "react-router-dom";
import { categoryPath } from "@/lib/catalog-path";
import { cn } from "@/lib/utils";

const SCROLL_ROW =
  "flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const pillClass = (active) =>
  cn(
    "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:bg-muted/60",
  );

export function CategorySubcategoryTextRail({
  parent,
  subcategories = [],
  activeChildSlug,
}) {
  if (!parent || subcategories.length === 0) return null;

  const allActive = !activeChildSlug;

  return (
    <nav className={SCROLL_ROW} aria-label="Subcategories">
      <Link to={categoryPath(parent)} className={pillClass(allActive)}>
        All {parent.name}
      </Link>
      {subcategories.map((child) => (
        <Link
          key={child.id}
          to={categoryPath(parent, child)}
          className={pillClass(child.slug === activeChildSlug)}
        >
          {child.name}
        </Link>
      ))}
    </nav>
  );
}
