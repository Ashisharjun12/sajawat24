import { useState } from "react";
import { Link } from "react-router-dom";
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
    ? "rounded-md"
    : compact
      ? "rounded-xl"
      : "rounded-2xl";

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
