import { createFolder, listFolders } from "@/api/folders.api"

const CUSTOM_BOOKINGS_NAME = "Custom bookings"
const CUSTOM_BOOKINGS_SLUG = "custom-bookings"

function asFolderList(data) {
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

export async function ensureCustomBookingsFolder() {
  const envId = import.meta.env.VITE_ADMIN_CUSTOM_BOOKING_FOLDER_ID?.trim()
  if (envId) {
    return { id: envId, name: CUSTOM_BOOKINGS_NAME, slug: CUSTOM_BOOKINGS_SLUG }
  }

  const roots = asFolderList(await listFolders({ parentId: "null" }))
  const existing = roots.find((folder) => folder.slug === CUSTOM_BOOKINGS_SLUG)
  if (existing) return existing

  try {
    return await createFolder({ name: CUSTOM_BOOKINGS_NAME })
  } catch (err) {
    if (err?.response?.status === 409) {
      const again = asFolderList(await listFolders({ parentId: "null" }))
      const found = again.find((folder) => folder.slug === CUSTOM_BOOKINGS_SLUG)
      if (found) return found
    }
    throw err
  }
}
