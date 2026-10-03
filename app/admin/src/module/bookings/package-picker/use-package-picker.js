import { useCallback, useEffect, useMemo } from "react"
import { listAdmin as listCategories } from "@/api/categories.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { getAdmin as getProduct, listAdmin as listProducts } from "@/api/products.api"
import { getApiError } from "@/api/api"
import { queryToProductListParams } from "@/module/catalog/filters/product-filter-query"
import { buildProductFilterFields } from "@/module/catalog/filters/product-filter-fields"
import { usePackagePickerStore } from "@/module/bookings/package-picker/package-picker.store"
import { assertBookableSlotLocal } from "@/module/bookings/package-picker/package-picker.utils"

const LIMIT = 20

export function usePackagePicker({ open, initialCityId, initialSelection }) {
  const page = usePackagePickerStore((s) => s.page)
  const filterQuery = usePackagePickerStore((s) => s.filterQuery)
  const productSearch = usePackagePickerStore((s) => s.productSearch)
  const leaves = usePackagePickerStore((s) => s.leaves)
  const products = usePackagePickerStore((s) => s.products)
  const total = usePackagePickerStore((s) => s.total)
  const loading = usePackagePickerStore((s) => s.loading)
  const error = usePackagePickerStore((s) => s.error)
  const cities = usePackagePickerStore((s) => s.cities)
  const citiesLoading = usePackagePickerStore((s) => s.citiesLoading)
  const selectedCity = usePackagePickerStore((s) => s.selectedCity)
  const selectedState = usePackagePickerStore((s) => s.selectedState)
  const selectedProductId = usePackagePickerStore((s) => s.selectedProductId)
  const productDetail = usePackagePickerStore((s) => s.productDetail)
  const detailLoading = usePackagePickerStore((s) => s.detailLoading)
  const detailError = usePackagePickerStore((s) => s.detailError)
  const draft = usePackagePickerStore((s) => s.draft)
  const slotError = usePackagePickerStore((s) => s.slotError)

  const cityId = selectedCity?.id ?? ""

  const states = useMemo(() => {
    const unique = new Set(cities.map((city) => city.state).filter(Boolean))
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [cities])

  const stateCities = useMemo(
    () => cities.filter((city) => city.state === selectedState),
    [cities, selectedState],
  )

  const filterParams = useMemo(() => queryToProductListParams(filterQuery), [filterQuery])

  const listParams = useMemo(
    () => ({
      ...filterParams,
      ...(productSearch.trim() ? { q: productSearch.trim() } : {}),
      cityId,
      isActive: "true",
      price: "set",
    }),
    [filterParams, productSearch, cityId],
  )

  const fields = useMemo(
    () => buildProductFilterFields({ leaves }).filter((field) => field.id !== "cityId"),
    [leaves],
  )

  const canConfirm = Boolean(
    selectedCity &&
      draft.productId &&
      draft.scheduledAt &&
      !assertBookableSlotLocal(draft.scheduledAt) &&
      !detailLoading,
  )

  const loadLeaves = useCallback(async () => {
    const parents = await listCategories({ parentId: null, limit: 100 })
    const nested = await Promise.all(
      (parents.items ?? []).map(async (parent) => {
        const kids = await listCategories({ parentId: parent.id, limit: 100 })
        return (kids.items ?? []).map((child) => ({
          ...child,
          label: `${parent.name} / ${child.name}`,
        }))
      }),
    )
    usePackagePickerStore.getState().setLeaves(nested.flat())
  }, [])

  const loadCities = useCallback(async () => {
    const api = usePackagePickerStore.getState()
    api.setCitiesLoading(true)
    try {
      const data = await listCities({ page: 1, limit: 100, isActive: "true" })
      api.setCities(data.items ?? [])
    } catch (err) {
      api.setError(getApiError(err))
      api.setCities([])
    } finally {
      api.setCitiesLoading(false)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    if (!cityId || !open) return
    const api = usePackagePickerStore.getState()
    api.setLoading(true)
    api.setError("")
    try {
      const data = await listProducts({
        page: api.page,
        limit: LIMIT,
        ...listParams,
      })
      api.setProducts(data.items ?? [], data.total ?? 0)
    } catch (err) {
      api.setError(getApiError(err))
      api.setProducts([], 0)
    } finally {
      api.setLoading(false)
    }
  }, [cityId, open, listParams])

  useEffect(() => {
    if (!open) return
    loadLeaves().catch((err) => usePackagePickerStore.getState().setError(getApiError(err)))
    loadCities()
  }, [open, loadLeaves, loadCities])

  useEffect(() => {
    if (!open) return
    loadProducts()
  }, [loadProducts, open])

  useEffect(() => {
    if (!open) {
      usePackagePickerStore.getState().reset()
      return
    }
    usePackagePickerStore.getState().hydrateFromInitial(initialSelection)
  }, [open, initialSelection])

  useEffect(() => {
    if (!open) return
    usePackagePickerStore.getState().hydrateCityFromId(initialCityId, cities)
  }, [open, initialCityId, cities])

  useEffect(() => {
    if (!open || !selectedProductId) {
      usePackagePickerStore.getState().setProductDetail(null)
      return
    }

    let cancelled = false
    const api = usePackagePickerStore.getState()
    api.setDetailLoading(true)
    api.setDetailError("")

    getProduct(selectedProductId)
      .then((product) => {
        if (cancelled) return
        const next = usePackagePickerStore.getState()
        next.setProductDetail(product)
        next.mergeDraftFromProduct(product)
      })
      .catch((err) => {
        if (!cancelled) {
          const next = usePackagePickerStore.getState()
          next.setDetailError(getApiError(err))
          next.setProductDetail(null)
        }
      })
      .finally(() => {
        if (!cancelled) usePackagePickerStore.getState().setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, selectedProductId])

  const {
    setPage,
    setFilterQuery,
    setProductSearch,
    selectState,
    selectCity,
    selectProduct,
    clearProduct,
    updateDraft,
    toggleAddon,
    confirmDraft,
  } = usePackagePickerStore.getState()

  return {
    page,
    setPage,
    limit: LIMIT,
    filterQuery,
    setFilterQuery,
    productSearch,
    setProductSearch,
    fields,
    products,
    total,
    loading,
    error,
    cities,
    citiesLoading,
    states,
    selectedState,
    selectState,
    stateCities,
    selectedCity,
    selectCity,
    selectedProductId,
    productDetail,
    detailLoading,
    detailError,
    draft,
    slotError,
    selectProduct,
    clearProduct,
    updateDraft,
    toggleAddon,
    confirmDraft,
    canConfirm,
  }
}
