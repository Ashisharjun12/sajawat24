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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { BannerFormDialog } from "@/module/cms/components/BannerFormDialog"
import { BannersTable } from "@/module/cms/components/BannersTable"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { PLACEMENT_LABELS } from "@/module/cms/lib/cms-constants"
import { CMS_PAGE_SIZE } from "@/module/cms/lib/cms-pagination"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"
import { ListPagination } from "@/module/geo/components/ListPagination"

const SORTABLE_LIMIT = 200

export function BannersPanel({ cities }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [placementFilter, setPlacementFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reordering, setReordering] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [imageTarget, setImageTarget] = useState("desktop")
  const [imagePreview, setImagePreview] = useState("")
  const [imageUploadId, setImageUploadId] = useState(null)
  const [mobileImagePreview, setMobileImagePreview] = useState("")
  const [mobileImageUploadId, setMobileImageUploadId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const sortable = placementFilter !== "all"

  useEffect(() => {
    setPage(1)
  }, [placementFilter])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listCmsBanners({
        page: sortable ? 1 : page,
        limit: sortable ? SORTABLE_LIMIT : CMS_PAGE_SIZE,
        ...(placementFilter === "all"
          ? { excludePlacement: "announcement_bar" }
          : { placement: placementFilter }),
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setItems([])
      setTotal(0)
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page, placementFilter, sortable])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setImagePreview("")
    setImageUploadId(null)
    setMobileImagePreview("")
    setMobileImageUploadId(null)
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setImagePreview(row.imageUrl ?? "")
    setImageUploadId(row.imageUploadId ?? null)
    setMobileImagePreview(row.mobileImageUrl ?? "")
    setMobileImageUploadId(row.mobileImageUploadId ?? null)
    setDialogOpen(true)
  }

  async function handleSave(body) {
    setSubmitting(true)
    try {
      const payload = {
        ...body,
        imageUrl: body.imageUrl || imagePreview,
        imageUploadId: body.imageUploadId || imageUploadId,
        mobileImageUploadId:
          body.mobileImageUploadId !== undefined ? body.mobileImageUploadId : mobileImageUploadId,
      }
      const { imageUrl, mobileImageUrl, cityName, image, mobileImage, ...apiBody } = payload
      if (editing?.id) {
        await patchCmsBanner(editing.id, apiBody)
        toast.add({ title: "Banner saved", type: "success" })
      } else {
        await createCmsBanner(apiBody)
        toast.add({ title: "Banner created", type: "success" })
      }
      setDialogOpen(false)
      setEditing(null)
      setImagePreview("")
      setImageUploadId(null)
      setMobileImagePreview("")
      setMobileImageUploadId(null)
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
      toast.add({ title: "Banner deleted", type: "success" })
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
      await reorderCmsBanners({ placement: placementFilter, ids: orderedIds })
      toast.add({ title: "Banner order updated", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      await load()
    } finally {
      setReordering(false)
    }
  }

  const empty = !loading && !error && total === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={placementFilter} onValueChange={setPlacementFilter}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue placeholder="Placement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All placements</SelectItem>
            {Object.entries(PLACEMENT_LABELS)
              .filter(([key]) => key !== "announcement_bar")
              .map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
          </SelectContent>
        </Select>
        {!empty ? (
          <Button type="button" size="sm" className="ml-auto" onClick={openCreate}>
            <PlusIcon />
            Add banner
          </Button>
        ) : null}
      </div>

      {sortable ? (
        <p className="text-xs text-muted-foreground">
          Drag rows to set display order for this placement. Mid and end slots show the first published banner in order.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Select a placement to drag-sort banners.</p>
      )}

      {empty ? (
        <CmsEmptyState
          icon={ImageIcon}
          title="No banners yet"
          description="Add hero, mid-page, or footer banners for your homepage."
          actionLabel="Create banner"
          onAction={openCreate}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <BannersTable
            items={items}
            sortable={sortable && !reordering && !loading}
            onReorder={handleReorder}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
          {!sortable ? (
            <ListPagination page={page} limit={CMS_PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : null}
        </div>
      )}

      <BannerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        cities={cities}
        defaultPlacement={placementFilter !== "all" ? placementFilter : "home_hero"}
        desktopPreview={imagePreview}
        mobilePreview={mobileImagePreview}
        imageUploadId={imageUploadId}
        mobileImageUploadId={mobileImageUploadId}
        onPickDesktopImage={() => {
          setImageTarget("desktop")
          setPickerOpen(true)
        }}
        onPickMobileImage={() => {
          setImageTarget("mobile")
          setPickerOpen(true)
        }}
        onClearMobileImage={() => {
          setMobileImagePreview("")
          setMobileImageUploadId(null)
        }}
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
          if (imageTarget === "mobile") {
            if (row?.url) setMobileImagePreview(row.url)
            if (row?.uploadId) setMobileImageUploadId(row.uploadId)
          } else {
            if (row?.url) setImagePreview(row.url)
            if (row?.uploadId) setImageUploadId(row.uploadId)
          }
        }}
      />

      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete this banner?"
        description="This removes the banner from the storefront."
        confirming={deletingBusy}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
