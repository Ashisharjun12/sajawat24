import { api, unwrap } from '@/api/client';

export type SiteBrandPublic = {
  companyName: string;
  footerDescription: string;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  whatsappUrl: string | null;
};

export type SiteShellResponse = {
  brand: SiteBrandPublic;
};

export function getSiteShell(platform: 'web' | 'mobile' = 'mobile') {
  return api
    .get('/catalog/cms/site-shell', { params: { platform } })
    .then(unwrap<SiteShellResponse>);
}
