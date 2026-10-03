import { cn } from "@/lib/utils";
import {
  BRAND_LOGO_DARK_URL,
  BRAND_LOGO_LIGHT_URL,
  CUSTOMER_BRAND_NAME,
} from "@/lib/brand-assets";

export function DecoryLogo({ className, lightSrc, darkSrc, alt = CUSTOMER_BRAND_NAME }) {
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
      <img src={light} alt="" className="size-full object-contain dark:hidden" />
      <img src={dark} alt="" className="hidden size-full object-contain dark:block" />
    </span>
  );
}
