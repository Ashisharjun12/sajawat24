import type { Href } from 'expo-router';

/** Only the privacy policy is linked for now; add more entries to LEGAL_PAGES if needed. */
export type LegalPageId = 'privacy';

export type LegalPageDef = {
  id: LegalPageId;
  /** Link text at the bottom of the Account tab. */
  label: string;
  /** Screen title while the CMS page loads (the page's own title replaces it). */
  title: string;
  /**
   * CMS page slugs to try, in order (admin → Brand → Pages). The first published one wins,
   * so the app works whether the admin used "privacy-policy" or "privacy".
   */
  slugs: string[];
};

export const LEGAL_PAGES: LegalPageDef[] = [
  {
    id: 'privacy',
    label: 'Privacy policy',
    title: 'Privacy policy',
    slugs: ['privacy-policy', 'privacy'],
  },
];

export function legalPageDef(id: string | undefined): LegalPageDef | null {
  return LEGAL_PAGES.find((page) => page.id === id) ?? null;
}

export function legalPageHref(id: LegalPageId): Href {
  return `/(app)/profile/legal/${id}` as Href;
}
