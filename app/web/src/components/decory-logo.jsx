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
    const light = lightSrc || null;
    const dark = darkSrc || null;
    const fallback = wordmarkSrc || BRAND_LOGO_WORDMARK_URL;
    const imgClass = cn(
      "h-9 w-auto max-w-[min(220px,52vw)] shrink-0 object-contain object-left",
      className,
    );

    // Header/footer sit on the brand colour, so prefer the dark-surface logo.
    if (onBrandSurface) {
      return <img src={dark || light || fallback} alt={alt} className={imgClass} />;
    }

    if (light && dark && light !== dark) {
      return (
        <>
          <img src={light} alt={alt} className={cn(imgClass, "dark:hidden")} />
          <img src={dark} alt="" className={cn(imgClass, "hidden dark:block")} />
        </>
      );
    }

    return <img src={light || dark || fallback} alt={alt} className={imgClass} />;
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
