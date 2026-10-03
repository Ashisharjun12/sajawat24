import { create } from "zustand";
import { buildProductSectionBadgeIndex } from "@/module/home/lib/product-section-badge-index";

export const useMerchSectionsStore = create((set) => ({
  status: "idle",
  sections: [],
  badgeByProductId: new Map(),

  setLoading: () =>
    set({
      status: "loading",
    }),

  setFromSections: (sections) => {
    const list = Array.isArray(sections) ? sections : [];
    set({
      status: "ready",
      sections: list,
      badgeByProductId: buildProductSectionBadgeIndex(list),
    });
  },

  clear: () =>
    set({
      status: "ready",
      sections: [],
      badgeByProductId: new Map(),
    }),
}));
