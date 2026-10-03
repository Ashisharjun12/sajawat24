import { goBackOneScreen, type GoBackOptions } from '@/lib/navigate-back';
import type { Href } from 'expo-router';
import { useCallback } from 'react';

export function useGoBack(options?: GoBackOptions) {
  const { fallbackHref, orHome = false } = options ?? {};
  return useCallback(() => {
    goBackOneScreen({ fallbackHref, orHome });
  }, [fallbackHref, orHome]);
}

export function useGoBackWithFallback(fallbackHref?: Href, orHome = false) {
  return useGoBack({ fallbackHref, orHome });
}
