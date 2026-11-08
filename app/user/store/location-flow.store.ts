import type { Href } from 'expo-router';
import { create } from 'zustand';

export type LocationFlowReturnTarget = 'checkout' | null;

type LocationFlowState = {
  returnTarget: LocationFlowReturnTarget;
  /** Screen to go back to after saving an address (e.g. the product page). */
  returnHref: Href | null;
  setReturnTarget: (target: LocationFlowReturnTarget) => void;
  setReturnHref: (href: Href | null) => void;
  clearReturn: () => void;
};

export const useLocationFlowStore = create<LocationFlowState>((set) => ({
  returnTarget: null,
  returnHref: null,
  setReturnTarget: (returnTarget) => set({ returnTarget, returnHref: null }),
  setReturnHref: (returnHref) => set({ returnHref, returnTarget: null }),
  clearReturn: () => set({ returnTarget: null, returnHref: null }),
}));

export function beginLocationFlowForCheckout() {
  useLocationFlowStore.getState().setReturnTarget('checkout');
}

/** Add-address flow started from a screen that should be shown again once saved. */
export function beginLocationFlowReturningTo(href: Href) {
  useLocationFlowStore.getState().setReturnHref(href);
}
