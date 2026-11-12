import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CategoryTileGridSkeleton,
  categoryPlpTopRailRowClass,
  categoryPlpTopRailTileClass,
} from "@/module/catalog/components/CategoryTileGrid";
import { HomeScrollControls } from "@/module/home/components/HomeScrollControls";
import { HomeCategoryTile } from "@/module/home/components/HomeCategoryTile";

/**
 * Image-card rail at the top of a category page. Shows top-level categories, or — when
 * `parent` is set — that parent's subcategories (links go to `/c/parent/child`).
 */
export function CategoryTopLevelImageRail({
  categories = [],
  activeParentSlug,
  activeSlug = activeParentSlug,
  parent = null,
  loading = false,
}) {
  const scrollRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 2;
    setOverflows(hasOverflow);
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, categories.length, loading]);

  function scrollByPage(direction) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  if (loading) {
    return <CategoryTileGridSkeleton count={5} layout="plp-top" />;
  }

  if (!categories.length) return null;

  const showDesktopControls = overflows;

  return (
    <div className="space-y-2">
      {showDesktopControls ? (
        <div className="hidden items-center justify-end md:flex">
          <HomeScrollControls
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => scrollByPage(-1)}
            onNext={() => scrollByPage(1)}
          />
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className={categoryPlpTopRailRowClass}
        aria-label={parent ? "Browse subcategories" : "Browse categories"}
      >
        {categories.map((category) => {
          const active = category.slug === activeSlug;
          return (
            <HomeCategoryTile
              key={category.id}
              category={category}
              parent={parent}
              navigation="link"
              compact
              squareImage
              active={active}
              className={categoryPlpTopRailTileClass}
            />
          );
        })}
      </div>
    </div>
  );
}
