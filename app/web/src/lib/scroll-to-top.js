import { getLenis } from "@/lib/lenis-instance";

/**
 * @param {{ behavior?: "auto" | "smooth" }} [options]
 */
export function scrollToTop({ behavior = "smooth" } = {}) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(0, { immediate: behavior === "auto" });
    return;
  }
  window.scrollTo({ top: 0, left: 0, behavior });
}

/**
 * @param {string} id
 * @param {{ behavior?: "auto" | "smooth"; offset?: number }} [options]
 */
export function scrollToElement(id, { behavior = "smooth", offset = 0 } = {}) {
  const el = document.getElementById(id);
  if (!el) return false;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset, immediate: behavior === "auto" });
    return true;
  }

  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, left: 0, behavior });
  return true;
}
