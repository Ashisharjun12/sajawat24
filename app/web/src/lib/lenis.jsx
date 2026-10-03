import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/lenis-instance";

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return undefined;

    const instance = new Lenis({ lerp: 0.09 });
    setLenis(instance);
    instance.on("scroll", ScrollTrigger.update);

    let rafId = 0;
    const raf = (time) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return children;
}
