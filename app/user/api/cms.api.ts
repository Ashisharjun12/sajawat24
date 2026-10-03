import { api, unwrap } from '@/api/client';

export type SiteBrandContact = {
  contactPhone: string | null;
  contactEmail: string | null;
  whatsappUrl: string | null;
  companyName: string;
};

export type SiteShellResponse = {
  brand: SiteBrandContact;
};

export function getSiteShell({ platform = 'mobile' }: { platform?: string } = {}) {
  return api
    .get('/catalog/cms/site-shell', { params: { platform } })
    .then(unwrap) as Promise<SiteShellResponse>;
}

export type HomeCmsResponse = {
  hero?: unknown[];
  mid?: unknown[];
  end?: unknown[];
  layoutBlocks?: unknown[];
  announcement?: unknown;
  announcements?: unknown[];
  testimonials?: unknown[];
  faqs?: unknown[];
};

export function getHomeCms({
  cityId,
  pincode,
  platform = 'android',
}: {
  cityId?: string | null;
  pincode?: string | null;
  platform?: string;
} = {}) {
  return api
    .get('/catalog/cms/home', {
      params: {
        ...(cityId ? { cityId } : {}),
        ...(pincode ? { pincode } : {}),
        platform,
      },
    })
    .then(unwrap) as Promise<HomeCmsResponse>;
}
