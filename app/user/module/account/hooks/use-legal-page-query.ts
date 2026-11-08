import { getCmsPage, type CmsPage } from '@/api/cms.api';
import type { LegalPageDef } from '@/module/account/lib/legal-pages';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * CMS pages are filtered by platform. Admin's default is ["web", "mobile"], so try the
 * app's "mobile" first, then "web" (for pages published to the website only).
 */
const PLATFORMS = ['mobile', 'web'] as const;

function isNotFound(err: unknown) {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

/** First published page among the def's slugs; `null` when none is published. */
async function fetchLegalPage(def: LegalPageDef): Promise<CmsPage | null> {
  for (const slug of def.slugs) {
    for (const platform of PLATFORMS) {
      try {
        return await getCmsPage(slug, { platform });
      } catch (err) {
        // 404 = not published under this slug/platform → try the next one.
        if (!isNotFound(err)) throw err;
      }
    }
  }
  return null;
}

export function useLegalPageQuery(def: LegalPageDef | null) {
  return useQuery({
    queryKey: ['cms', 'legal-page', def?.id],
    queryFn: () => fetchLegalPage(def!),
    enabled: Boolean(def),
    staleTime: 30 * 60_000,
  });
}
