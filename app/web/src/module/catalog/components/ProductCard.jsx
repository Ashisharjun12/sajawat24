import { Link } from "react-router-dom";
import { useState } from "react";
import { productPath } from "@/lib/catalog-path";
import { formatPaise } from "@/lib/money";
import { DecoryImageFallback } from "@/components/decory-image-fallback";

export function ProductCard({ product }) {
  const [broken, setBroken] = useState(false);
  const src = product.images?.[0]?.url;

  return (
    <Link
      to={productPath(product)}
      className="group block w-[220px] min-w-[220px] shrink-0"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
        {src && !broken ? (
          <img
            src={src}
            alt=""
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            onError={() => setBroken(true)}
          />
        ) : (
          <DecoryImageFallback />
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
        <p className="text-sm text-muted-foreground">
          Starts at{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatPaise(product.pricePaise)}
          </span>
        </p>
      </div>
    </Link>
  );
}
