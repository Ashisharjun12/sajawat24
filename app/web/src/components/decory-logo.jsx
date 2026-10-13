import { cn } from "@/lib/utils";
import {
  BRAND_LOGO_DARK_URL,
  BRAND_LOGO_LIGHT_URL,
  BRAND_LOGO_WORDMARK_URL,
  CUSTOMER_BRAND_NAME,
} from "@/lib/brand-assets";

export function DecoryLogo({
  className,
  lightSrc,
  darkSrc,
  wordmarkSrc,
  variant = "icon",
  alt = CUSTOMER_BRAND_NAME,
  onBrandSurface = false,
}) {
  if (variant === "wordmark") {
    const src = wordmarkSrc || BRAND_LOGO_WORDMARK_URL;
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-9 w-auto max-w-[min(220px,52vw)] shrink-0 object-contain object-left",
          className,
        )}
      />
    );
  }

  const light = lightSrc || BRAND_LOGO_LIGHT_URL;
  const dark = darkSrc || BRAND_LOGO_DARK_URL;

  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 overflow-hidden rounded-[22%]",
        className,
      )}
      role="img"
      aria-label={alt}
    >
      {onBrandSurface ? (
        <>
          <img src={dark} alt="" className="size-full object-contain dark:hidden" />
          <img src={light} alt="" className="hidden size-full object-contain dark:block" />
        </>
      ) : (
        <>
          <img src={light} alt="" className="size-full object-contain dark:hidden" />
          <img src={dark} alt="" className="hidden size-full object-contain dark:block" />
        </>
      )}
    </span>
  );
}
