import { cn } from "@/lib/utils";

const DEFAULT_LIGHT_SRC = "https://ik.imagekit.io/aevhlnk0h/decoryy-light.png";
const DEFAULT_DARK_SRC = "https://ik.imagekit.io/aevhlnk0h/decoryy-dark.png";

export function DecoryLogo({ className, lightSrc, darkSrc, alt = "Decoryy" }) {
  const light = lightSrc || DEFAULT_LIGHT_SRC;
  const dark = darkSrc || DEFAULT_DARK_SRC;

  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 overflow-hidden rounded-[22%]",
        className,
      )}
      role="img"
      aria-label={alt}
    >
      <img src={light} alt="" className="size-full object-cover dark:hidden" />
      <img src={dark} alt="" className="hidden size-full object-cover dark:block" />
    </span>
  );
}
