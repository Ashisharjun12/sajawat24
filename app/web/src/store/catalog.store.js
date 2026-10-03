import { create } from "zustand";

export const useCatalogStore = create((set, get) => ({
  categories: [],
  status: "idle",
  /** @deprecated Categories load via TanStack Query + CatalogQuerySync */
  load: async () => {},
}));
