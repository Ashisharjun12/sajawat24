import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CatalogProductGrid } from "@/module/catalog/components/CatalogProductGrid";
import { CategoryTileGrid } from "@/module/catalog/components/CategoryTileGrid";
import {
  budgetLabel,
  resolveOccasionCategoryIds,
} from "@/module/catalog/lib/catalog-search";
import { normalizeCategoryTree } from "@/module/home/lib/home-catalog";
import { useCatalogStore } from "@/store/catalog.store";
import { useLocationStore } from "@/store/location.store";

function budgetLabelFromUrl(minPrice, maxPrice) {
  const min = minPrice != null ? Number(minPrice) : null;
  const max = maxPrice != null ? Number(maxPrice) : null;
  if (min === 3000 && max === 6000) return budgetLabel("3k-6k");
  if (max === 3000 && (min == null || min === 0)) return budgetLabel("under-3k");
  if (min === 6000 && max == null) return budgetLabel("6k-plus");
  if (min != null || max != null) {
    const parts = [];
    if (min != null) parts.push(`from ₹${min.toLocaleString("en-IN")}`);
    if (max != null) parts.push(`up to ₹${max.toLocaleString("en-IN")}`);
    return parts.join(" ");
  }
  return null;
}

export function DecorationsPage() {
  const [searchParams] = useSearchParams();
  const occasionSlug = searchParams.get("occasion")?.trim() || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const instantOnly = searchParams.get("instant") === "1";

  const city = useLocationStore((s) => s.city);
  const catalogStatus = useCatalogStore((s) => s.status);
  const rawCategories = useCatalogStore((s) => s.categories);

  const categories = useMemo(
    () => normalizeCategoryTree(rawCategories),
    [rawCategories],
  );
  const loadingCategories = catalogStatus === "loading" || catalogStatus === "idle";

  const { ids: categoryIds, parent: occasionParent } = useMemo(
    () => resolveOccasionCategoryIds(categories, occasionSlug),
    [categories, occasionSlug],
  );

  const unknownOccasion = Boolean(occasionSlug && !occasionParent);
  const effectiveCategoryIds =
    occasionSlug && !unknownOccasion && categoryIds.length ? categoryIds : undefined;

  const pageTitle = instantOnly
    ? "Instant setups"
    : occasionParent
      ? `${occasionParent.name} setups`
      : "All decorations";

  const budgetSummary = budgetLabelFromUrl(minPrice, maxPrice);

  const showCategoryTiles = !occasionSlug;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          {" / "}
          Decorations
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          {pageTitle}
        </h1>
        <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
          Browse setups priced for{" "}
          {city?.name ? (
            <span className="font-medium text-foreground">{city.name}</span>
          ) : (
            "your city"
          )}
          {budgetSummary ? (
            <>
              {" "}
              · <span className="font-medium text-foreground">{budgetSummary}</span>
            </>
          ) : null}
          .
        </p>
        {unknownOccasion ? (
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t find that occasion — showing all setups instead.
          </p>
        ) : null}
      </div>

      {showCategoryTiles && (categories.length > 0 || loadingCategories) ? (
        <section className="mb-10" aria-label="Categories">
          <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight">
            Shop by occasion
          </h2>
          <CategoryTileGrid
            categories={categories}
            navigation="link"
            loading={loadingCategories}
          />
        </section>
      ) : null}

      <CatalogProductGrid
        sectionTitle={occasionParent ? "Packages" : "All packages"}
        categoryIds={effectiveCategoryIds}
        limit={20}
        emptyDescription={
          occasionParent
            ? "Try another budget or browse all decorations."
            : "Check back soon or try another city."
        }
      />
    </div>
  );
}
