import { create } from "zustand"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import { EMPTY_DRAFT } from "@/module/bookings/package-picker/package-picker.types"
import {
  assertBookableSlotLocal,
  formatProductPrice,
  productCoverUrl,
} from "@/module/bookings/package-picker/package-picker.utils"

function createInitialState() {
  return {
    page: 1,
    filterQuery: createFilterQuery(),
    productSearch: "",
    leaves: [],
    products: [],
    total: 0,
    loading: false,
    error: "",
    cities: [],
    citiesLoading: false,
    selectedCity: null,
    selectedState: "",
    selectedProductId: "",
    productDetail: null,
    detailLoading: false,
    detailError: "",
    draft: { ...EMPTY_DRAFT },
    slotError: "",
  }
}

export const usePackagePickerStore = create((set, get) => ({
  ...createInitialState(),

  reset: () => set(createInitialState()),

  setPage: (page) => set({ page }),
  setFilterQuery: (filterQuery) => set({ filterQuery }),
  setProductSearch: (productSearch) => set({ productSearch, page: 1 }),
  setLeaves: (leaves) => set({ leaves }),
  setCities: (cities) => set({ cities }),
  setCitiesLoading: (citiesLoading) => set({ citiesLoading }),
  setProducts: (products, total) => set({ products, total }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setProductDetail: (productDetail) => set({ productDetail }),
  setDetailLoading: (detailLoading) => set({ detailLoading }),
  setDetailError: (detailError) => set({ detailError }),

  hydrateFromInitial: (initialSelection) => {
    if (initialSelection?.productId) {
      set({
        selectedProductId: initialSelection.productId,
        draft: {
          productId: initialSelection.productId,
          productName: initialSelection.productName ?? "",
          scheduledAt: initialSelection.scheduledAt ?? "",
          quantity: initialSelection.quantity ?? 1,
          addonIds: initialSelection.addonIds ?? [],
        },
      })
    } else {
      set({ selectedProductId: "", draft: { ...EMPTY_DRAFT } })
    }
  },

  hydrateCityFromId: (initialCityId, cities) => {
    if (!initialCityId || !cities.length) return
    const match = cities.find((city) => city.id === initialCityId)
    if (match) {
      set({
        selectedCity: { id: match.id, name: match.name, state: match.state },
        selectedState: match.state,
      })
    }
  },

  selectState: (state) =>
    set({
      selectedState: state,
      selectedCity: null,
      selectedProductId: "",
      productDetail: null,
      draft: { ...EMPTY_DRAFT },
      slotError: "",
      page: 1,
      products: [],
      total: 0,
    }),

  selectCity: (city) =>
    set({
      selectedCity: { id: city.id, name: city.name, state: city.state },
      selectedProductId: "",
      productDetail: null,
      draft: { ...EMPTY_DRAFT },
      slotError: "",
      page: 1,
      products: [],
      total: 0,
    }),

  selectProduct: (productId) => set({ selectedProductId: productId, slotError: "" }),

  clearProduct: () =>
    set({
      selectedProductId: "",
      productDetail: null,
      draft: { ...EMPTY_DRAFT },
      slotError: "",
      detailError: "",
    }),

  mergeDraftFromProduct: (product) =>
    set((state) => ({
      draft: {
        ...state.draft,
        productId: product.id,
        productName: product.name ?? state.draft.productName,
        addonIds: state.draft.productId === product.id ? state.draft.addonIds : [],
      },
    })),

  updateDraft: (patch) =>
    set((state) => {
      const draft = { ...state.draft, ...patch }
      const slotError =
        patch.scheduledAt !== undefined ? assertBookableSlotLocal(patch.scheduledAt) ?? "" : state.slotError
      return { draft, slotError }
    }),

  toggleAddon: (addonId) =>
    set((state) => {
      const addonIds = state.draft.addonIds.includes(addonId)
        ? state.draft.addonIds.filter((id) => id !== addonId)
        : [...state.draft.addonIds, addonId]
      return { draft: { ...state.draft, addonIds } }
    }),

  confirmDraft: () => {
    const { selectedCity, draft, productDetail } = get()
    if (!selectedCity) {
      return { ok: false, error: "Select a city" }
    }
    if (!draft.productId || !productDetail) {
      return { ok: false, error: "Select a package" }
    }
    const slotErr = assertBookableSlotLocal(draft.scheduledAt)
    if (slotErr) {
      set({ slotError: slotErr })
      return { ok: false, error: slotErr }
    }
    const price = formatProductPrice(productDetail, selectedCity.id)

    return {
      ok: true,
      selection: {
        productId: draft.productId,
        productName: draft.productName || productDetail.name,
        coverUrl: productCoverUrl(productDetail),
        pricePaise: price?.pricePaise ?? null,
        compareAtPaise: price?.compareAtPaise ?? null,
        scheduledAt: new Date(draft.scheduledAt).toISOString(),
        quantity: draft.quantity,
        addonIds: draft.addonIds,
        cityId: selectedCity.id,
        cityName: selectedCity.name,
      },
      city: selectedCity,
    }
  },

  getCanConfirm: () => {
    const { selectedCity, draft, detailLoading } = get()
    return Boolean(
      selectedCity &&
        draft.productId &&
        draft.scheduledAt &&
        !assertBookableSlotLocal(draft.scheduledAt) &&
        !detailLoading,
    )
  },
}))
