import { createFolder, listFolders } from "@/api/folders.api"

const CATEGORY_ICONS_NAME = "Category icons"
const CATEGORY_ICONS_SLUG = "category-icons"

function asFolderList(data) {
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

/** Root media folder the bar-icon picker opens in (created on first use). */
export async function ensureCategoryIconsFolder() {
  const roots = asFolderList(await listFolders({ parentId: "null" }))
  const existing = roots.find((folder) => folder.slug === CATEGORY_ICONS_SLUG)
  if (existing) return existing

  try {
    return await createFolder({ name: CATEGORY_ICONS_NAME })
  } catch (err) {
    if (err?.response?.status === 409) {
      const again = asFolderList(await listFolders({ parentId: "null" }))
      const found = again.find((folder) => folder.slug === CATEGORY_ICONS_SLUG)
      if (found) return found
    }
    throw err
  }
}
