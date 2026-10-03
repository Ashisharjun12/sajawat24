import { useEffect, useMemo, useState } from "react"
import { listAdmin as listAddons } from "@/api/addons.api"
import { getAdmin as getProduct } from "@/api/products.api"
import { addonImageSrc } from "@/module/catalog/components/AddonThumb"
import {
  formatProductPrice,
  productCoverUrl,
} from "@/module/bookings/package-picker/package-picker.utils"

function addonLabel(addon) {
  if (addon.color?.name) return `${addon.name} · ${addon.color.name}`
  return addon.name ?? "Add-on"
}

function mapAddonRow(addon) {
  return {
    id: addon.id,
    name: addonLabel(addon),
    coverUrl: addonImageSrc(addon),
    pricePaise: addon.pricePaise ?? 0,
    compareAtPaise: addon.compareAtPaise ?? null,
  }
}

export function useBookingOrderPreview({
  enabled = true,
  productId,
  cityId,
  addonIds,
  quantity = 1,
  fallback,
}) {
  const addonKey = useMemo(() => (addonIds ?? []).join(","), [addonIds])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState({
    productName: "",
    coverUrl: "",
    price: null,
    addons: [],
    totalPaise: null,
  })

  useEffect(() => {
    if (!enabled) {
      setFetched({
        productName: "",
        coverUrl: "",
        price: null,
        addons: [],
        totalPaise: null,
      })
      setLoading(false)
      return
    }

    if (!productId) {
      setFetched({
        productName: "",
        coverUrl: "",
        price: null,
        addons: [],
        totalPaise: null,
      })
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      getProduct(productId),
      listAddons({ page: 1, limit: 100, isActive: "true" }),
    ])
      .then(([product, addonsData]) => {
        if (cancelled) return

        const selectedIds = addonKey ? addonKey.split(",").filter(Boolean) : []
        const catalog = (addonsData.items ?? []).filter((row) => selectedIds.includes(row.id))
        const addonRows = catalog.map(mapAddonRow)
        const price = cityId ? formatProductPrice(product, cityId) : null
        const cityPrice = cityId
          ? (product.prices ?? []).find((row) => row.cityId === cityId)
          : null
        const basePaise = cityPrice?.pricePaise ?? product.pricePaise ?? 0
        const addonsPaise = addonRows.reduce((sum, row) => sum + row.pricePaise, 0)

        setFetched({
          productName: product.name ?? "Package",
          coverUrl: productCoverUrl(product),
          price,
          addons: addonRows,
          totalPaise: (basePaise + addonsPaise) * quantity,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setFetched({
            productName: fallback?.productName ?? "",
            coverUrl: fallback?.coverUrl ?? "",
            price:
              fallback?.pricePaise != null
                ? {
                    pricePaise: fallback.pricePaise,
                    compareAtPaise: fallback.compareAtPaise ?? null,
                  }
                : null,
            addons: fallback?.addons ?? [],
            totalPaise: fallback?.totalPaise ?? null,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, productId, cityId, addonKey, quantity])

  const productName = fetched.productName || fallback?.productName || ""
  const coverUrl = fetched.coverUrl || fallback?.coverUrl || ""
  const price =
    fetched.price ??
    (fallback?.pricePaise != null
      ? { pricePaise: fallback.pricePaise, compareAtPaise: fallback.compareAtPaise ?? null }
      : null)
  const addons = fetched.addons.length > 0 ? fetched.addons : fallback?.addons ?? []
  const totalPaise = fetched.totalPaise ?? fallback?.totalPaise ?? null

  return {
    loading,
    productName,
    coverUrl,
    price,
    addons,
    totalPaise,
  }
}
