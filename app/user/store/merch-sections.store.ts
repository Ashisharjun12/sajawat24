import type { HomeProductSection } from '@/module/home/lib/home-catalog';
import {
  buildProductSectionBadgeIndex,
  buildSectionsSignature,
  type ProductSectionBadgeEntry,
} from '@/module/home/lib/product-section-badge-index';
import { create } from 'zustand';

type MerchSectionsState = {
  status: 'idle' | 'loading' | 'ready';
  sections: HomeProductSection[];
  badgeByProductId: Map<string, ProductSectionBadgeEntry>;
  sectionsSignature: string;
  setLoading: () => void;
  setFromSections: (sections: HomeProductSection[]) => void;
  clear: () => void;
};

export const useMerchSectionsStore = create<MerchSectionsState>((set) => ({
  status: 'idle',
  sections: [],
  badgeByProductId: new Map(),
  sectionsSignature: '',

  setLoading: () =>
    set({
      status: 'loading',
    }),

  setFromSections: (sections) => {
    const list = Array.isArray(sections) ? sections : [];
    const signature = buildSectionsSignature(list);
    const state = useMerchSectionsStore.getState();
    if (signature === state.sectionsSignature && list.length > 0) {
      return;
    }
    set({
      status: 'ready',
      sections: list,
      sectionsSignature: signature,
      badgeByProductId: buildProductSectionBadgeIndex(list),
    });
  },

  clear: () =>
    set({
      status: 'ready',
      sections: [],
      sectionsSignature: '',
      badgeByProductId: new Map(),
    }),
}));
