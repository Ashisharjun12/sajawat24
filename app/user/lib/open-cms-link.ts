import * as Linking from 'expo-linking';
import { type Href, router } from 'expo-router';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Map CMS / web hrefs to Expo Router paths before in-app navigation. */
export function resolveAppHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/(app)/')) {
    return trimmed;
  }

  const productMatch = trimmed.match(/^\/p\/([^/?#]+)/);
  if (productMatch) {
    return `/(app)/product/${productMatch[1]}`;
  }

  const appProductMatch = trimmed.match(/^\/product\/([^/?#]+)/);
  if (appProductMatch && UUID_RE.test(appProductMatch[1])) {
    return `/(app)/product/${appProductMatch[1]}`;
  }

  const categoryTwo = trimmed.match(/^\/c\/([^/?#]+)\/([^/?#]+)/);
  if (categoryTwo) {
    const [, parentSlug, childSlug] = categoryTwo;
    return `/(app)/category?parentSlug=${encodeURIComponent(parentSlug)}&childSlug=${encodeURIComponent(childSlug)}`;
  }

  const categoryOne = trimmed.match(/^\/c\/([^/?#]+)/);
  if (categoryOne) {
    return `/(app)/category?parentSlug=${encodeURIComponent(categoryOne[1])}`;
  }

  if (trimmed === '/decorations' || trimmed.startsWith('/decorations?')) {
    if (trimmed.includes('instant=1')) {
      return '/(app)/instant';
    }
    return '/(app)/category';
  }

  if (trimmed === '/explore' || trimmed.startsWith('/explore')) {
    return '/(app)/explore';
  }

  if (trimmed === '/instant' || trimmed.startsWith('/instant')) {
    return '/(app)/instant';
  }

  if (trimmed === '/category' || trimmed.startsWith('/category')) {
    if (trimmed.includes('?')) {
      return `/(app)/category${trimmed.slice('/category'.length)}`;
    }
    return '/(app)/category';
  }

  if (trimmed === '/search' || trimmed.startsWith('/search')) {
    return '/(app)/search';
  }

  if (trimmed === '/' || trimmed === '/home') {
    return '/(app)';
  }

  return trimmed;
}

/** Open CMS href: in-app paths or external URLs. */
export function openCmsLink(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return;

  if (/^https?:\/\//i.test(trimmed)) {
    void Linking.openURL(trimmed);
    return;
  }

  if (trimmed.startsWith('/')) {
    const resolved = resolveAppHref(trimmed);
    router.push(resolved as Href);
    return;
  }

  void Linking.openURL(trimmed);
}
