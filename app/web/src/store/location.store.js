import { persist } from "zustand/middleware";
import { create } from "zustand";

export const LOCATION_STORAGE_KEY = "decory-web-location";
export const LOCATION_PROMPT_DISMISSED_KEY = "decory-location-prompt-dismissed";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBackendCityId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

export function isLegacyDemoCity(city) {
  return !city?.id || !isBackendCityId(city.id);
}

export function formatLocationLabel(city, pincode, source) {
  if (!city?.name) {
    return "Select city";
  }
  if (pincode?.code) {
    return `${city.name} · ${pincode.code}`;
  }
  return city.name;
}

export const useLocationStore = create(
  persist(
    (set) => ({
      city: null,
      pincode: null,
      source: null,
      cities: [],
      status: "idle",
      pickerOpen: false,
      needsPrompt: false,
      setCities: (cities) => set({ cities }),
      setStatus: (status) => set({ status }),
      setLocation: ({ city, pincode = null, source = "manual" }) =>
        set({
          city,
          pincode,
          source,
          pickerOpen: false,
          needsPrompt: false,
        }),
      setCity: (city) =>
        set({
          city,
          pincode: null,
          source: "manual",
          pickerOpen: false,
          needsPrompt: false,
        }),
      clearLocation: () =>
        set({
          city: null,
          pincode: null,
          source: null,
          needsPrompt: true,
        }),
      setPickerOpen: (pickerOpen) => set({ pickerOpen }),
      setNeedsPrompt: (needsPrompt) => set({ needsPrompt }),
    }),
    {
      name: LOCATION_STORAGE_KEY,
      partialize: (state) => ({
        city: state.city,
        pincode: state.pincode,
        source: state.source,
      }),
    },
  ),
);
