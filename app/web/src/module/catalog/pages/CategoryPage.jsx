import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { useSiteShell } from "@/module/site/hooks/use-site-shell";
import { categoryPath } from "@/lib/catalog-path";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogProductGrid } from "@/module/catalog/components/CatalogProductGrid";
import { CategoryTopLevelImageRail } from "@/module/catalog/components/CategoryTopLevelImageRail";
import { HomeProductCardRailSkeleton } from "@/module/home/components/HomeProductCard";
import {
  categoryProductIds,
  findCategoryBySlugs,
  isCategoryRouteValid,
} from "@/module/catalog/lib/category-nav";
import { normalizeCategoryTree } from "@/module/home/lib/home-catalog";
import { useCatalogStore } from "@/store/catalog.store";

export function CategoryPage() {
  const { parentSlug, childSlug } = useParams();
  const { pathname } = useLocation();
  const { brand } = useSiteShell();
  const catalogStatus = useCatalogStore((s) => s.status);
  const rawCategories = useCatalogStore((s) => s.categories);

  const categories = useMemo(
    () => normalizeCategoryTree(rawCategories),
    [rawCategories],
  );

  const { parent, child } = useMemo(
    () => findCategoryBySlugs(categories, parentSlug, childSlug),
    [categories, parentSlug, childSlug],
  );

  const valid = isCategoryRouteValid({ parent, childSlug, child });
  const loading = catalogStatus === "loading" || catalogStatus === "idle";

  const pageTitle = child?.name ?? parent?.name ?? parentSlug;
  const subcategories = parent?.children ?? [];
  const parentChildIds = useMemo(
    () => subcategories.map((row) => row.id),
    [subcategories],
  );
  const productIds = useMemo(
    () => categoryProductIds({ parent, child }),
    [parent, child],
  );

  const productSectionTitle = "All packages";

  const categorySeoTitle = valid ? pageTitle : "Category not found";
  const categorySeo = (
    <SeoHead
      title={categorySeoTitle}
      description={`Browse ${categorySeoTitle} decoration packages and book for your city.`}
      pathname={pathname}
      siteName={brand.companyName || undefined}
      ogImage={brand.logoLightUrl || brand.logoDarkUrl || undefined}
    />
  );

  if (!loading && !valid) {
    return (
      <>
        {categorySeo}
      <div className="mx-auto w-full max-w-[1240px] px-4 py-12 md:px-8">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          {" / "}
          <Link to="/decorations" className="hover:text-foreground">Decorations</Link>
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight">
          Category not found
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">
          This category may have been removed or the link is outdated.
        </p>
        <Button type="button" nativeButton={false} render={<Link to="/decorations" />} className="mt-6">
          Browse all decorations
        </Button>
      </div>
      </>
    );
  }

  return (
    <>
      {categorySeo}
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      <div className="mb-4 md:mb-8">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          {" / "}
          <Link to="/decorations" className="hover:text-foreground">Decorations</Link>
          {parent ? (
            <>
              {" / "}
              {child ? (
                <Link to={categoryPath(parent)} className="hover:text-foreground">
                  {parent.name}
                </Link>
              ) : (
                <span className="text-foreground">{parent.name}</span>
              )}
            </>
          ) : null}
          {child ? (
            <>
              {" / "}
              <span className="text-foreground">{child.name}</span>
            </>
          ) : null}
        </p>
        <h1 className="mt-2 min-w-0 font-heading text-xl font-semibold leading-tight tracking-tight md:text-3xl">
          {loading ? "…" : pageTitle}
        </h1>
        {child && parent ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link to={categoryPath(parent)} className="font-medium text-foreground hover:underline">
              ← All {parent.name}
            </Link>
          </p>
        ) : null}
      </div>

      <section className="mb-6 space-y-3" aria-label="Category navigation">
        <div className="-mx-4 px-4 md:mx-0 md:px-0">
          {subcategories.length > 0 && parent ? (
            <CategoryTopLevelImageRail
              categories={subcategories}
              parent={parent}
              activeSlug={childSlug}
            />
          ) : (
            <CategoryTopLevelImageRail
              categories={categories}
              activeParentSlug={parentSlug}
              loading={loading}
            />
          )}
        </div>
      </section>

      {parent || (!loading && valid) ? (
        <CatalogProductGrid
          categoryIds={productIds}
          sectionTitle={productSectionTitle}
          emptyTitle="No packages in this category yet"
          emptyDescription="Try another subcategory or browse all decorations."
          childRouteActive={Boolean(child)}
          parentChildIds={parentChildIds}
        />
      ) : loading ? (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-6 w-48 rounded-md" />
          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 md:gap-3 lg:grid-cols-5">
            {Array.from({ length: 8 }, (_, i) => (
              <HomeProductCardRailSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
    </>
  );
}
