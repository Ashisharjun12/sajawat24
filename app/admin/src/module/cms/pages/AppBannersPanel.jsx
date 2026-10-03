import { useCallback, useEffect, useState } from "react"
import { ImageIcon, PlusIcon } from "lucide-react"
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
import { AppBannerFormDialog } from "@/module/cms/components/AppBannerFormDialog"
import { BannersTable } from "@/module/cms/components/BannersTable"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { MobilePhonePreview } from "@/module/cms/components/MobilePhonePreview"
import { linkPreviewLabel } from "@/module/cms/lib/app-banner-link"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"

const PLACEMENT = "home_hero"
const SORTABLE_LIMIT = 200

export function AppBannersPanel({ cities = [] }) {
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
  const [livePreview, setLivePreview] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listCmsBanners({
        page: 1,
        limit: SORTABLE_LIMIT,
        placement: PLACEMENT,
        platform: "android",
      })
      setItems(data.items ?? [])
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
        toast.add({ title: "App hero saved", type: "success" })
      } else {
        await createCmsBanner(apiBody)
        toast.add({ title: "App hero created", type: "success" })
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
      toast.add({ title: "App hero deleted", type: "success" })
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
      await reorderCmsBanners({ placement: PLACEMENT, ids: orderedIds })
      toast.add({ title: "Hero order updated", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      await load()
    } finally {
      setReordering(false)
    }
  }

  const empty = !loading && !error && items.length === 0
  const previewHero =
    livePreview?.imageUrl
      ? {
          imageUrl: livePreview.imageUrl,
          href: livePreview.href || "",
          linkLabel: livePreview.linkLabel || linkPreviewLabel(livePreview.href),
        }
      : items[0]
        ? {
            imageUrl: items[0].mobileImageUrl || items[0].imageUrl || "",
            href: items[0].href || "",
            linkLabel: linkPreviewLabel(items[0].href),
          }
        : null

  return (
    <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Android app home hero carousel</p>
          {!empty ? (
            <Button type="button" size="sm" className="ml-auto" onClick={openCreate}>
              <PlusIcon />
              Add hero
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Drag rows to set carousel order. Includes legacy banners tagged for mobile.
        </p>

        {empty ? (
          <CmsEmptyState
            icon={ImageIcon}
            title="No app heroes yet"
            description="Add full-width slides for the customer Android app home screen."
            actionLabel="Create hero"
            onAction={openCreate}
          />
        ) : (
          <BannersTable
            items={items}
            sortable={!reordering && !loading}
            onReorder={handleReorder}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}

        <AppBannerFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editing}
          cities={cities}
          imagePreview={imagePreview}
          imageUploadId={imageUploadId}
          onPickImage={() => setPickerOpen(true)}
          onPreviewChange={setLivePreview}
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
            if (row?.url) {
              setImagePreview(row.url)
              setLivePreview((prev) => ({
                ...prev,
                imageUrl: row.url,
              }))
            }
            if (row?.uploadId) setImageUploadId(row.uploadId)
          }}
        />

        <CmsDeleteDialog
          open={Boolean(deleting)}
          onOpenChange={(open) => { if (!open) setDeleting(null) }}
          title="Delete this app hero?"
          description="This removes the slide from the Android app home carousel."
          confirming={deletingBusy}
          onConfirm={confirmDelete}
        />
      </div>

      <MobilePhonePreview hero={previewHero} className="lg:sticky lg:top-4" />
    </div>
  )
}
