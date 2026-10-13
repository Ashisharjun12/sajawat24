import { useCallback, useEffect, useState } from "react"
import { MegaphoneIcon, PlusIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  createCmsBanner,
  deleteCmsBanner,
  listCmsBanners,
  patchCmsBanner,
  reorderCmsBanners,
} from "@/api/cms.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { AppAnnouncementFormDialog } from "@/module/cms/components/AppAnnouncementFormDialog"
import { AnnouncementsTable } from "@/module/cms/components/AnnouncementsTable"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"

const SORTABLE_LIMIT = 200

function sortAnnouncements(rows) {
  return [...rows].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
}

export function AppAnnouncementsPanel({ cities = [] }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reordering, setReordering] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [imageUploadId, setImageUploadId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listCmsBanners({
        page: 1,
        limit: SORTABLE_LIMIT,
        placement: "announcement_bar",
        platform: "android_only",
      })
      setItems(sortAnnouncements(data.items ?? []))
    } catch (err) {
      setItems([])
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setImagePreview("")
    setImageUploadId(null)
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setImagePreview(row.mobileImageUrl ?? row.imageUrl ?? "")
    setImageUploadId(row.mobileImageUploadId ?? row.imageUploadId ?? null)
    setDialogOpen(true)
  }

  async function handleSave(body) {
    setSubmitting(true)
    try {
      const { imageUrl, mobileImageUrl, cityName, image, mobileImage, ...apiBody } = body
      if (editing?.id) {
        await patchCmsBanner(editing.id, apiBody)
        toast.add({ title: "App announcement saved", type: "success" })
      } else {
        await createCmsBanner(apiBody)
        toast.add({ title: "App announcement created", type: "success" })
      }
      setDialogOpen(false)
      setEditing(null)
      setImagePreview("")
      setImageUploadId(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteCmsBanner(deleting.id)
      toast.add({ title: "App announcement deleted", type: "success" })
      setDeleting(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setDeletingBusy(false)
    }
  }

  async function handleReorder(orderedIds) {
    const nextItems = orderedIds
      .map((id, index) => {
        const row = items.find((item) => item.id === id)
        return row ? { ...row, sortIndex: index } : null
      })
      .filter(Boolean)
    setItems(nextItems)
    setReordering(true)
    try {
      await reorderCmsBanners({ placement: "announcement_bar", ids: orderedIds })
      toast.add({ title: "Announcement order updated", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      await load()
    } finally {
      setReordering(false)
    }
  }

  const empty = !loading && !error && items.length === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="min-w-0 flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!empty ? (
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={openCreate}>
              <PlusIcon />
              Add announcement
            </Button>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Lists announcements that include the Android app platform only (not web/mobile-only bars).
          Drag rows to set launch order. #0 opens first on app start (until dismissed).
        </p>

        {empty ? (
          <CmsEmptyState
            icon={MegaphoneIcon}
            title="No app announcements yet"
            description="Create launch promos with optional hero image for the Android customer app."
            actionLabel="Create announcement"
            onAction={openCreate}
          />
        ) : (
          <AnnouncementsTable
            items={items}
            sortable={!reordering && !loading}
            onReorder={handleReorder}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}

        <AppAnnouncementFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editing}
          cities={cities}
          imagePreview={imagePreview}
          imageUploadId={imageUploadId}
          onPickImage={() => setPickerOpen(true)}
          submitting={submitting}
          onSubmit={handleSave}
        />
        <ProductMediaPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          attached={[]}
          max={1}
          kinds={["image"]}
          onAdd={(picked) => {
            const row = picked[0] ? toGalleryItem(picked[0]) : null
            if (row?.url) setImagePreview(row.url)
            if (row?.uploadId) setImageUploadId(row.uploadId)
          }}
        />

        <CmsDeleteDialog
          open={Boolean(deleting)}
          onOpenChange={(open) => { if (!open) setDeleting(null) }}
          title="Delete this app announcement?"
          description="This removes the launch sheet promo from the Android app."
          confirming={deletingBusy}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  )
}
