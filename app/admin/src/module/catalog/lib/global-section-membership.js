import { listSectionProducts, putSectionProducts } from "@/api/sections.api"

export const SECTION_PRODUCT_MAX = 24

export function findGlobalSectionForProduct(occupancyItems, productId) {
  if (!productId) return null
  const row = (occupancyItems ?? []).find((item) => item.productId === productId)
  return row?.sectionId ?? null
}

async function globalSectionProductIds(sectionId) {
  const data = await listSectionProducts(sectionId)
  return (data.items ?? []).map((row) => row.productId)
}

export async function removeProductFromGlobalSection(sectionId, productId) {
  if (!sectionId || !productId) return
  const ids = await globalSectionProductIds(sectionId)
  if (!ids.includes(productId)) return
  await putSectionProducts(sectionId, {
    cityId: null,
    productIds: ids.filter((id) => id !== productId),
  })
}

export async function appendProductToGlobalSection(sectionId, productId) {
  if (!sectionId || !productId) return
  const ids = await globalSectionProductIds(sectionId)
  if (ids.includes(productId)) return
  if (ids.length >= SECTION_PRODUCT_MAX) {
    throw new Error(`A section can have at most ${SECTION_PRODUCT_MAX} products`)
  }
  await putSectionProducts(sectionId, {
    cityId: null,
    productIds: [...ids, productId],
  })
}

export async function syncProductGlobalSection({ productId, nextSectionId, previousSectionId }) {
  const next = nextSectionId || null
  const previous = previousSectionId || null
  if (next === previous) return
  if (previous) {
    await removeProductFromGlobalSection(previous, productId)
  }
  if (next) {
    await appendProductToGlobalSection(next, productId)
  }
}

export function buildSectionSelectOptions(sections, currentSectionId) {
  const list = sections ?? []
  const byId = new Map(list.map((row) => [row.id, row]))
  const active = list.filter((row) => row.isActive)
  active.sort((a, b) => {
    const order = (a.sortIndex ?? 0) - (b.sortIndex ?? 0)
    if (order !== 0) return order
    return String(a.name ?? "").localeCompare(String(b.name ?? ""))
  })
  const options = [...active]
  if (currentSectionId && !options.some((row) => row.id === currentSectionId)) {
    const current = byId.get(currentSectionId)
    if (current) options.unshift(current)
  }
  return options
}
