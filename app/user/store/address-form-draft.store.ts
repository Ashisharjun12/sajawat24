import { emptyAddressForm, type AddressFormState } from '@/module/account/lib/address-form';
import { create } from 'zustand';

type AddressFormDraftState = {
  form: AddressFormState;
  editAddressId: string | null;
  setDraft: (form: AddressFormState, editAddressId?: string | null) => void;
  clear: () => void;
};

export const useAddressFormDraftStore = create<AddressFormDraftState>((set) => ({
  form: emptyAddressForm,
  editAddressId: null,
  setDraft: (form, editAddressId = null) => set({ form, editAddressId }),
  clear: () => set({ form: emptyAddressForm, editAddressId: null }),
}));
