import { useEffect } from "react";
import { getLenis } from "@/lib/lenis-instance";

/** Stops Lenis and locks document scroll while `active` (modal/sheet open). */
export function useLockPageScrollWhen(active) {
  useEffect(() => {
    if (!active) return undefined;

    const lenis = getLenis();
    lenis?.stop();

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      lenis?.start();
    };
  }, [active]);
}
