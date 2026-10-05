export type PdpDetailTabId = 'includes' | 'faqs' | 'delivery' | 'care';

export type PdpPackageDetailTabMeta = {
  id: PdpDetailTabId;
  label: string;
  panelTitle: string;
  chipIdle: string;
  chipActive: string;
};

/** Matches `app/web` `ProductPdpDetailsTabs` chip tabs (mobile). */
export const PDP_PACKAGE_DETAIL_TABS: PdpPackageDetailTabMeta[] = [
  {
    id: 'includes',
    label: 'Included',
    panelTitle: 'Included in your setup',
    chipIdle: 'bg-success/10 text-emerald-900',
    chipActive: 'bg-primary text-primary-foreground',
  },
  {
    id: 'faqs',
    label: 'FAQs',
    panelTitle: 'Common questions',
    chipIdle: 'bg-violet-500/10 text-violet-900',
    chipActive: 'bg-violet-600 text-white',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    panelTitle: 'Delivery & setup',
    chipIdle: 'bg-sky-500/10 text-sky-900',
    chipActive: 'bg-sky-600 text-white',
  },
  {
    id: 'care',
    label: 'Care',
    panelTitle: 'Care instructions',
    chipIdle: 'bg-amber-500/10 text-amber-950',
    chipActive: 'bg-amber-700 text-white',
  },
];

export function pdpDetailCountLabel(tab: PdpDetailTabId, count: number): string | null {
  if (count <= 0) return null;
  if (tab === 'includes') return `${count} item${count === 1 ? '' : 's'}`;
  if (tab === 'faqs') return `${count} FAQ${count === 1 ? '' : 's'}`;
  if (tab === 'delivery') return `${count} note${count === 1 ? '' : 's'}`;
  return `${count} tip${count === 1 ? '' : 's'}`;
}
