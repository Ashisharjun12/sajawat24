import { create } from 'zustand';

export type LocationFlowReturnTarget = 'checkout' | null;

type LocationFlowState = {
  returnTarget: LocationFlowReturnTarget;
  setReturnTarget: (target: LocationFlowReturnTarget) => void;
  clearReturn: () => void;
};

export const useLocationFlowStore = create<LocationFlowState>((set) => ({
  returnTarget: null,
  setReturnTarget: (returnTarget) => set({ returnTarget }),
  clearReturn: () => set({ returnTarget: null }),
}));

export function beginLocationFlowForCheckout() {
  useLocationFlowStore.getState().setReturnTarget('checkout');
}
