import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { categoryPath, productPath } from "@/lib/catalog-path";
import { getLenis } from "@/lib/lenis-instance";
import {
  buildCategorySearchIndex,
  categoryIdsForSearchHits,
  filterCategorySearchHits,
  preferCategoryProductFilter,
} from "@/module/catalog/lib/search-category-suggestions";
import { normalizeCategoryTree } from "@/module/home/lib/home-catalog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  MIN_QUERY_LEN,
  useProductSearchQuery,
} from "@/module/catalog/hooks/use-product-search-query";
import { SearchCategoryBadges } from "@/module/layout/components/SearchCategoryBadges";
import { SearchProductRow } from "@/module/layout/components/SearchProductRow";
import { SearchProductRowSkeleton } from "@/module/layout/components/SearchProductRowSkeleton";
import { useCatalogStore } from "@/store/catalog.store";
import { isBackendCityId, useLocationStore } from "@/store/location.store";
import { useSearchDialogStore } from "@/store/search-dialog.store";

const MODAL_CATEGORY_LIMIT = 8;
const MODAL_CATEGORY_SEARCH_LIMIT = 6;
const MODAL_PRODUCT_LIMIT = 5;

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";

function subscribeMdDownMedia(listener) {
  const mq = window.matchMedia(MD_DOWN_MEDIA_QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

function getMdDownMediaSnapshot() {
  return window.matchMedia(MD_DOWN_MEDIA_QUERY).matches;
}

function useIsMdDown() {
  return useSyncExternalStore(subscribeMdDownMedia, getMdDownMediaSnapshot, () => false);
}

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /mac/i.test(navigator.userAgent);
}

export function SearchCommand({ variant = "bar", className, fullScreen = false }) {
  const open = useSearchDialogStore((s) => s.open);
  const setOpen = useSearchDialogStore((s) => s.setOpen);
  const isMdDown = useIsMdDown();
  const effectiveFullScreen = fullScreen && isMdDown;
  const renderDialog = !fullScreen || isMdDown;
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const rawCategories = useCatalogStore((s) => s.categories);
  const categories = useMemo(
    () => normalizeCategoryTree(rawCategories),
    [rawCategories],
  );
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);

  const hasLocation =
    Boolean(pincode?.code) || (city?.id && isBackendCityId(city.id));

  const categorySearchIndex = useMemo(
    () => buildCategorySearchIndex(categories),
    [categories],
  );

  const categorySuggestions = useMemo(() => {
    const limit = query.trim()
      ? MODAL_CATEGORY_SEARCH_LIMIT
      : MODAL_CATEGORY_LIMIT;
    return filterCategorySearchHits(categorySearchIndex, query, { limit });
  }, [categorySearchIndex, query]);

  const categoryHitsForProducts = useMemo(() => {
    if (query.trim().length < MIN_QUERY_LEN) return [];
    return filterCategorySearchHits(categorySearchIndex, query, {
      limit: MODAL_CATEGORY_SEARCH_LIMIT,
    });
  }, [categorySearchIndex, query]);

  const productCategoryIds = useMemo(() => {
    const ids = categoryIdsForSearchHits(categoryHitsForProducts);
    return ids.length > 0 ? ids : undefined;
  }, [categoryHitsForProducts]);

  const categoryScopedProductSearch = useMemo(
    () => preferCategoryProductFilter(categoryHitsForProducts, query),
    [categoryHitsForProducts, query],
  );

  const { data: products = [], isLoading, isFetching, isError } = useProductSearchQuery(
    query,
    {
      enabled: open,
      categoryIds: productCategoryIds,
      categoryScopedSearch: categoryScopedProductSearch,
    },
  );

  const visibleProducts = useMemo(
    () => products.slice(0, MODAL_PRODUCT_LIMIT),
    [products],
  );

  const isBrowseMode = query.trim().length < MIN_QUERY_LEN;

  function goToCategory(hit) {
    setOpen(false);
    navigate(categoryPath(hit.parent, hit.child));
  }
  const showSkeletons = (isLoading || isFetching) && products.length === 0;
  const showEmpty =
    !showSkeletons && !isLoading && products.length === 0 && hasLocation && !isError;

  const shortcut = isMacPlatform() ? "⌘K" : "Ctrl K";

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const lenis = getLenis();
    lenis?.stop();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open]);

  useEffect(() => {
    if (variant !== "bar") return undefined;
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  function goToProduct(product) {
    setOpen(false);
    navigate(productPath(product));
  }

  const dialog = (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search decorations and occasions"
      showCloseButton={effectiveFullScreen}
      className={cn(
        effectiveFullScreen
          ? "inset-0 top-0 left-0 h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 ring-0"
          : "top-[10vh] max-w-[min(100%-1.25rem,40rem)] translate-y-0 sm:max-w-[40rem]",
      )}
    >
      <Command
        shouldFilter={false}
        className={cn(
          "flex flex-col overflow-hidden bg-card p-0 shadow-none",
          effectiveFullScreen
            ? "h-full max-h-[100dvh] rounded-none"
            : "max-h-[min(36rem,82vh)] rounded-3xl",
        )}
      >
        <div
          className={cn(
            "shrink-0",
            effectiveFullScreen
              ? "px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
              : "px-3 pt-3",
          )}
        >
          <CommandInput
            iconPosition="start"
            placeholder="Search birthday, haldi, themes…"
            value={query}
            onValueChange={setQuery}
            wrapperClassName="pb-1.5"
            inputGroupClassName={cn(
              "border border-primary/25 bg-background px-1 shadow-sm ring-1 ring-primary/10",
              effectiveFullScreen ? "h-12 rounded-2xl" : "h-11 rounded-2xl",
            )}
          />
          <p className="px-1 text-xs text-muted-foreground">
            Search by occasion, theme or decoration
          </p>
        </div>
        <CommandList
          className={cn(
            "min-h-0 max-h-none flex-1 overflow-y-auto overscroll-contain px-2 pb-3",
            effectiveFullScreen && "px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
          data-lenis-prevent
        >
          {!hasLocation ? (
            <div className="px-2 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Pick your city</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We need a serviceable city to search local setups.
              </p>
              <Button
                type="button"
                className="mt-4 rounded-lg"
                onClick={() => {
                  setOpen(false);
                  setPickerOpen(true);
                }}
              >
                Select city
              </Button>
            </div>
          ) : (
            <>
              {categorySuggestions.length > 0 ? (
                <SearchCategoryBadges
                  hits={categorySuggestions}
                  query={query}
                  onSelect={goToCategory}
                />
              ) : null}

              <div
                className={cn(
                  "pt-2",
                  categorySuggestions.length > 0 && "mt-1 border-t border-border/50",
                )}
              >
                <div className="flex items-baseline justify-between gap-2 px-2 py-1.5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {isBrowseMode ? (
                      <>
                        <SparklesIcon className="size-4 text-emerald-600" aria-hidden />
                        Popular right now
                      </>
                    ) : (
                      "Results"
                    )}
                  </p>
                  {isBrowseMode ? (
                    <span className="text-xs text-muted-foreground">Ideas for your next party</span>
                  ) : null}
                </div>
                {showSkeletons ? (
                  <div className="pb-1">
                    {Array.from({ length: MODAL_PRODUCT_LIMIT }).map((_, i) => (
                      <SearchProductRowSkeleton key={i} />
                    ))}
                  </div>
                ) : null}
                {visibleProducts.length > 0 ? (
                  <CommandGroup className="p-0">
                    {visibleProducts.map((product) => (
                      <SearchProductRow
                        key={product.id}
                        product={product}
                        onSelect={() => goToProduct(product)}
                      />
                    ))}
                  </CommandGroup>
                ) : null}
                {showEmpty ? (
                  <CommandEmpty className="py-8 text-muted-foreground">
                    No setups found.
                  </CommandEmpty>
                ) : null}
                {isError ? (
                  <p className="px-2 py-6 text-center text-sm text-destructive">
                    Could not load products. Try again.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </CommandList>
        {hasLocation ? (
          <div
            className={cn(
              "shrink-0 border-t border-border/50 bg-card",
              effectiveFullScreen
                ? "px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
                : "px-3 pb-3 pt-2",
            )}
          >
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full border-primary/20 bg-primary/5 text-sm font-medium text-foreground hover:bg-primary/10"
              onClick={() => {
                setOpen(false);
                navigate("/decorations");
              }}
            >
              Explore all decorations
              <ArrowRightIcon className="size-4" aria-hidden />
            </Button>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Kbd>Tab</Kbd>
                Explore
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>Enter</Kbd>
                Open
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>Esc</Kbd>
                Close
              </span>
            </p>
          </div>
        ) : null}
      </Command>
    </CommandDialog>
  );

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-full bg-background px-4 text-left text-[13px] text-muted-foreground shadow-sm",
            className,
          )}
        >
          <SearchIcon className="size-4 shrink-0 text-amber-700" />
          <span className="min-w-0 flex-1 truncate">
            Search decorations, occasions…
          </span>
        </button>
        {renderDialog ? dialog : null}
      </>
    );
  }

  if (variant === "icon" || variant === "toolbarIcon") {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-9 shrink-0",
            variant === "icon" && "md:hidden",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          <SearchIcon className="size-5" />
          <span className="sr-only">Search</span>
        </Button>
        {renderDialog ? dialog : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-10 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-left text-[13.5px] text-muted-foreground transition-shadow hover:shadow-sm",
          className,
        )}
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search decorations, occasions…</span>
        <Kbd className="hidden sm:inline-flex">{shortcut}</Kbd>
      </button>
      {renderDialog ? dialog : null}
    </>
  );
}
