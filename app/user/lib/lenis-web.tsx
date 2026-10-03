import { setLenis } from '@/lib/lenis-instance';
import Lenis from 'lenis';
import { useEffect, type ReactNode } from 'react';

/** Web-only smooth scroll (DOM). Native uses `SmoothScrollView` + platform scroll physics. */
export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return undefined;

    const instance = new Lenis({ lerp: 0.09 });
    setLenis(instance);

    let rafId = 0;
    const raf = (time: number) => {
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
