import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "lucide-react";
import { categoryPath } from "@/lib/catalog-path";
import { resolveCategoryIcon } from "@/lib/category-icons";
import { categoryImageUrl } from "@/module/home/lib/home-catalog";
import { cn } from "@/lib/utils";
import { DecoryImageFallback } from "@/components/decory-image-fallback";

export function HomeCategoryTile({
  category,
  parent,
  onDrill,
  onNavigate,
  className,
  navigation = "drill",
  compact = false,
  squareImage = false,
  active = false,
  /** "tile" = image + label below (default); "card" = tall Swiggy-style card (home row). */
  variant = "tile",
}) {
  const [broken, setBroken] = useState(false);
  const hasChildren = category.children?.length > 0;
  const { Icon, iconBg } = resolveCategoryIcon({
    iconKey: category.iconKey,
    iconTone: category.iconTone,
    slug: category.slug,
  });
  const imageUrl = categoryImageUrl(category);
  const label = category.name;
  const tileClass = cn(
    "group flex min-w-0 flex-col items-center",
    compact ? "gap-1" : "gap-2",
    className,
  );

  const imageRadius = squareImage
    ? "rounded-[var(--r-btn)]"
    : "rounded-[var(--r-card)]";

  const imageBox = (
    <span
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden bg-transparent",
        imageRadius,
        active && "border-2 border-primary",
        !imageUrl && !broken && iconBg,
      )}
    >
      {imageUrl && !broken ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.04]"
          onError={() => setBroken(true)}
        />
      ) : imageUrl && broken ? (
        <DecoryImageFallback className={imageRadius} />
      ) : (
        <Icon
          className={compact ? "size-7 sm:size-8" : "size-9 sm:size-10"}
          strokeWidth={1.75}
        />
      )}
    </span>
  );

  if (variant === "card") {
    const childCount = category.children?.length ?? 0;
    const cardHref = hasChildren
      ? categoryPath(category)
      : parent
        ? categoryPath(parent, category)
        : categoryPath(category);
    // Full-bleed 3:4 card: the admin image (900×1200, no baked-in title) fills the card and
    // the name + "Explore ›" sit top-left on a soft white fade. Without an image, show icon + name.
    const hasImage = imageUrl && !broken;
    const cardInner = (
      <span
        className={cn(
          "relative block aspect-[3/4] w-full overflow-hidden",
          !hasImage && iconBg,
        )}
      >
        {hasImage ? (
          <>
            <img
              src={imageUrl}
              alt={label}
              loading="lazy"
              decoding="async"
              className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
              onError={() => setBroken(true)}
            />
            {/* Name top-left on a soft white fade (no pill/border): title + green "Explore ›". */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-start gap-1 bg-linear-to-b from-white/95 via-white/70 to-transparent px-3 pt-3 pb-10 text-left sm:px-3.5 sm:pt-3.5"
            >
              <span className="line-clamp-2 font-heading text-[15px] font-semibold leading-tight tracking-tight text-neutral-900 sm:text-base">
                {label}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary sm:text-[13px]">
                Explore
                <ChevronRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
              </span>
            </span>
            {childCount > 0 ? (
              <span className="sr-only">{`${childCount} subcategories`}</span>
            ) : null}
          </>
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center">
            {imageUrl && broken ? (
              <DecoryImageFallback className="absolute inset-0 size-full" />
            ) : (
              <Icon className="size-10" strokeWidth={1.75} />
            )}
            <span className="relative line-clamp-2 font-heading text-sm font-extrabold uppercase leading-tight text-foreground">
              {label}
            </span>
          </span>
        )}
      </span>
    );
    const cardClass = cn(
      "group flex min-w-0 flex-col overflow-hidden rounded-[var(--r-card)] border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md",
      className,
    );
    if (hasChildren && navigation === "drill") {
      return (
        <button type="button" onClick={() => onDrill?.(category)} className={cardClass}>
          {cardInner}
        </button>
      );
    }
    return (
      <Link to={cardHref} className={cardClass} onClick={() => onNavigate?.()}>
        {cardInner}
      </Link>
    );
  }

  const labelEl = (
    <span
      className={cn(
        "line-clamp-2 w-full px-0.5 text-center font-semibold leading-snug text-foreground",
        compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs",
      )}
    >
      {label}
    </span>
  );

  if (hasChildren && navigation === "drill") {
    return (
      <button type="button" onClick={() => onDrill?.(category)} className={tileClass}>
        {imageBox}
        {labelEl}
      </button>
    );
  }

  if (hasChildren && navigation === "link") {
    const href = categoryPath(category);
    return (
      <Link to={href} className={tileClass} onClick={() => onNavigate?.()}>
        {imageBox}
        {labelEl}
      </Link>
    );
  }

  const href = parent ? categoryPath(parent, category) : categoryPath(category);

  return (
    <Link to={href} className={tileClass} onClick={() => onNavigate?.()}>
      {imageBox}
      {labelEl}
    </Link>
  );
}
