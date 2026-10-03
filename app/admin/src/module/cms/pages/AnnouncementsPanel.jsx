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
import { AnnouncementFormDialog } from "@/module/cms/components/AnnouncementFormDialog"
import { AnnouncementsTable } from "@/module/cms/components/AnnouncementsTable"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"

const SORTABLE_LIMIT = 200

function sortAnnouncements(rows) {
  return [...rows].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
}

export function AnnouncementsPanel({ cities }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reordering, setReordering] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
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
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setDialogOpen(true)
  }

  async function handleSave(body) {
    setSubmitting(true)
    try {
      const { imageUrl, cityName, image, ...apiBody } = {
        ...body,
        sortIndex: editing?.sortIndex ?? items.length,
      }
      if (editing?.id) {
        await patchCmsBanner(editing.id, apiBody)
        toast.add({ title: "Announcement saved", type: "success" })
      } else {
        await createCmsBanner(apiBody)
        toast.add({ title: "Announcement created", type: "success" })
      }
      setDialogOpen(false)
      setEditing(null)
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
      toast.add({ title: "Announcement deleted", type: "success" })
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

      <p className="text-xs text-muted-foreground">Drag rows to set scroll order. #0 shows first in the marquee.</p>

      {empty ? (
        <CmsEmptyState
          icon={MegaphoneIcon}
          title="No announcements yet"
          description="Create top-bar messages that scroll horizontally on the storefront."
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

      <AnnouncementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        cities={cities}
        submitting={submitting}
        onSubmit={handleSave}
      />

      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete this announcement?"
        description="This removes the message from the storefront announcement bar."
        confirming={deletingBusy}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
