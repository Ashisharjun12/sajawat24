export async function fetchCatalogStatusCounts(listFn) {
  const [all, published, unpublished] = await Promise.all([
    listFn({ page: 1, limit: 1 }),
    listFn({ page: 1, limit: 1, isActive: "true" }),
    listFn({ page: 1, limit: 1, isActive: "false" }),
  ])
  return {
    total: all.total ?? 0,
    published: published.total ?? 0,
    unpublished: unpublished.total ?? 0,
  }
}

export function countByActive(items) {
  const rows = items ?? []
  let published = 0
  let unpublished = 0
  for (const row of rows) {
    if (row.isActive) published += 1
    else unpublished += 1
  }
  return { total: rows.length, published, unpublished }
}
