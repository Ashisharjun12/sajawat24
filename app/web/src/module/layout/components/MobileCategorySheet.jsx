import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, SearchIcon } from "lucide-react";
import { categoryPath } from "@/lib/catalog-path";
import { listTopLevelCategories, resolveCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { categoryImageUrl } from "@/module/home/lib/home-catalog";
import { useCatalogStore } from "@/store/catalog.store";
import { useCategorySheetStore } from "@/store/category-sheet.store";

/** Show search when a level has more than this many categories. */
const SEARCH_THRESHOLD = 8;

function CategoryCircleTile({ category, parent, onDrill, onNavigate }) {
  const [broken, setBroken] = useState(false);
  const hasChildren = category.children?.length > 0;
  const imageUrl = categoryImageUrl(category);
  const { Icon, iconBg } = resolveCategoryIcon({
    iconKey: category.iconKey,
    iconTone: category.iconTone,
    slug: category.slug,
  });

  const circle = (
    <span
      className={cn(
        "relative flex size-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-border/60 bg-muted",
        !imageUrl && !broken && iconBg,
      )}
    >
      {imageUrl && !broken ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : imageUrl && broken ? (
        <DecoryImageFallback className="size-full text-[10px]" />
      ) : (
        <Icon className="size-7" strokeWidth={1.75} />
      )}
    </span>
  );

  const label = (
    <span className="line-clamp-2 w-full px-0.5 text-center text-[11px] font-semibold leading-snug text-foreground">
      {category.name}
    </span>
  );

  const tileClass =
    "flex min-w-0 flex-col items-center gap-2 rounded-2xl p-1 transition-colors active:bg-muted/80";

  if (hasChildren) {
    return (
      <button type="button" className={tileClass} onClick={() => onDrill?.(category)}>
        {circle}
        {label}
      </button>
    );
  }

  const href = parent ? categoryPath(parent, category) : categoryPath(category);

  return (
    <Link to={href} className={tileClass} onClick={() => onNavigate?.()}>
      {circle}
      {label}
    </Link>
  );
}

export function MobileCategorySheet() {
  const open = useCategorySheetStore((s) => s.open);
  const setOpen = useCategorySheetStore((s) => s.setOpen);
  const categories = useCatalogStore((s) => s.categories);
  const topLevel = useMemo(() => listTopLevelCategories(categories), [categories]);
  const [stack, setStack] = useState([]);
  const [query, setQuery] = useState("");

  const currentParent = stack[stack.length - 1] ?? null;
  const levelCategories = useMemo(() => {
    if (currentParent) return currentParent.children ?? [];
    return topLevel;
  }, [currentParent, topLevel]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return levelCategories;
    return levelCategories.filter((row) => row.name?.toLowerCase().includes(q));
  }, [levelCategories, query]);

  const title = currentParent?.name ?? "Categories";
  const showSearch = levelCategories.length > SEARCH_THRESHOLD;

  useEffect(() => {
    if (!open) {
      setStack([]);
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    setQuery("");
  }, [currentParent?.id]);

  function close() {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(88dvh,34rem)] w-[calc(100%-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 gap-1 border-b border-border/60 px-4 py-3 pr-12 text-left">
          <div className="flex items-center gap-2">
            {currentParent ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-full"
                aria-label="Back"
                onClick={() => setStack((prev) => prev.slice(0, -1))}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
            ) : null}
            <DialogTitle className="font-heading text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {currentParent
              ? `${levelCategories.length} subcategories`
              : levelCategories.length > SEARCH_THRESHOLD
                ? `${levelCategories.length} categories — scroll or search`
                : "Browse by occasion & theme"}
          </DialogDescription>
        </DialogHeader>

        {showSearch ? (
          <div className="shrink-0 border-b border-border/40 px-4 py-2.5">
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories…"
                className="h-9 rounded-full pl-9 text-sm"
                aria-label="Search categories"
              />
            </div>
          </div>
        ) : null}

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]"
          data-lenis-prevent
        >
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {query.trim() ? "No categories match your search" : "No categories yet"}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5">
              {filtered.map((category) => (
                <CategoryCircleTile
                  key={category.id}
                  category={category}
                  parent={currentParent}
                  onDrill={(next) => setStack((prev) => [...prev, next])}
                  onNavigate={close}
                />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full"
            nativeButton={false}
            render={<Link to="/decorations" onClick={close} />}
          >
            View all decorations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
