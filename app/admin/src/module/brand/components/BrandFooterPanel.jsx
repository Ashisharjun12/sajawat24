import { useCallback, useEffect, useState } from "react"
import { Columns3Icon, PlusIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  createBrandFooterColumn,
  deleteBrandFooterColumn,
  listBrandFooterColumns,
  patchBrandFooterColumn,
  putBrandFooterColumnLinks,
  reorderBrandFooterColumns,
} from "@/api/brand.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { HomeLayoutTable } from "@/module/cms/components/HomeLayoutTable"
import { FooterColumnFormDialog } from "@/module/brand/components/FooterColumnFormDialog"

export function BrandFooterPanel() {
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
      const data = await listBrandFooterColumns()
      setItems(
        (data.items ?? []).map((row) => ({
          ...row,
          type: "footer_column",
          cityName: `${row.links?.length ?? 0} links`,
        })),
      )
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
      const { links, ...meta } = body
      if (editing?.id) {
        await patchBrandFooterColumn(editing.id, meta)
        await putBrandFooterColumnLinks(editing.id, links)
        toast.add({ title: "Column updated", type: "success" })
      } else {
        const created = await createBrandFooterColumn(meta)
        if (links?.length) {
          await putBrandFooterColumnLinks(created.id, links)
        }
        toast.add({ title: "Column created", type: "success" })
      }
      setDialogOpen(false)
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
      await deleteBrandFooterColumn(deleting.id)
      toast.add({ title: "Column deleted", type: "success" })
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
      await reorderBrandFooterColumns({ ids: orderedIds })
      toast.add({ title: "Order updated", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      await load()
    } finally {
      setReordering(false)
    }
  }

  const empty = !loading && !error && items.length === 0

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Link columns to the right of the brand block on the storefront footer.
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!empty ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={openCreate}>
            <PlusIcon />
            Add column
          </Button>
        </div>
      ) : null}
      {empty ? (
        <CmsEmptyState
          icon={Columns3Icon}
          title="No footer columns"
          description="Add columns such as Explore, Support, or Company links."
          actionLabel="Add column"
          onAction={openCreate}
        />
      ) : (
        <HomeLayoutTable
          items={items}
          sortable={!reordering && !loading}
          onReorder={handleReorder}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}
      <FooterColumnFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSubmit={handleSave}
        submitting={submitting}
      />
      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete footer column?"
        description="This column and its links will be removed."
        onConfirm={confirmDelete}
        confirming={deletingBusy}
      />
    </div>
  )
}
