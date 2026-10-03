import { create } from "zustand";

export const useSearchDialogStore = create((set) => ({
  open: false,
  setOpen: (open) =>
    set((state) => ({
      open: typeof open === "function" ? open(state.open) : open,
    })),
  requestOpen: () => set({ open: true }),
}));
