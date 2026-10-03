import { useCallback, useEffect, useState } from "react"
import { CircleHelpIcon, PlusIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  createCmsFaq,
  deleteCmsFaq,
  listCmsFaqs,
  patchCmsFaq,
  reorderCmsFaqs,
} from "@/api/cms.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { FaqFormDialog } from "@/module/cms/components/FaqFormDialog"
import { FaqTable } from "@/module/cms/components/FaqTable"

const LIST_LIMIT = 200

export function FaqPanel() {
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
      const data = await listCmsFaqs({ page: 1, limit: LIST_LIMIT })
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
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setDialogOpen(true)
  }

  async function handleSave(body) {
    setSubmitting(true)
    try {
      if (editing?.id) {
        await patchCmsFaq(editing.id, body)
        toast.add({ title: "FAQ updated", type: "success" })
      } else {
        await createCmsFaq(body)
        toast.add({ title: "FAQ created", type: "success" })
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
      await deleteCmsFaq(deleting.id)
      toast.add({ title: "FAQ deleted", type: "success" })
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
      await reorderCmsFaqs({ ids: orderedIds })
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
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Questions shown at the bottom of the homepage. Only published items appear on the site, in
        the order below.
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
            Add FAQ
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">Drag rows to set display order.</p>

      {empty ? (
        <CmsEmptyState
          icon={CircleHelpIcon}
          title="No FAQs yet"
          description="Add questions and answers for the homepage FAQ section."
          actionLabel="Add FAQ"
          onAction={openCreate}
        />
      ) : (
        <FaqTable
          items={items}
          sortable={!reordering && !loading}
          onReorder={handleReorder}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}

      <FaqFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSubmit={handleSave}
        submitting={submitting}
      />

      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete FAQ?"
        description="This question will be removed from the homepage."
        onConfirm={confirmDelete}
        confirming={deletingBusy}
      />
    </div>
  )
}
