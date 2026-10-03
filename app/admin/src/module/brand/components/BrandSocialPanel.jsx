import { useCallback, useEffect, useState } from "react"
import { PlusIcon, Share2Icon } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  createBrandSocialLink,
  deleteBrandSocialLink,
  listBrandSocialLinks,
  patchBrandSocialLink,
  reorderBrandSocialLinks,
} from "@/api/brand.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"
import { FaqTable } from "@/module/cms/components/FaqTable"
import { SocialLinkFormDialog } from "@/module/brand/components/SocialLinkFormDialog"

const LIST_LIMIT = 200

export function BrandSocialPanel() {
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
      const data = await listBrandSocialLinks({ page: 1, limit: LIST_LIMIT })
      setItems(
        (data.items ?? []).map((row) => ({
          ...row,
          question: row.label,
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
      if (editing?.id) {
        await patchBrandSocialLink(editing.id, body)
        toast.add({ title: "Social link updated", type: "success" })
      } else {
        await createBrandSocialLink(body)
        toast.add({ title: "Social link created", type: "success" })
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
      await deleteBrandSocialLink(deleting.id)
      toast.add({ title: "Social link deleted", type: "success" })
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
      await reorderBrandSocialLinks({ ids: orderedIds })
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
        Icons and links in the footer brand column. Drag to set order.
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
            Add link
          </Button>
        </div>
      ) : null}
      {empty ? (
        <CmsEmptyState
          icon={Share2Icon}
          title="No social links"
          description="Add Instagram, WhatsApp, and other profiles."
          actionLabel="Add link"
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
      <SocialLinkFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSubmit={handleSave}
        submitting={submitting}
      />
      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete social link?"
        description="This link will be removed from the footer."
        onConfirm={confirmDelete}
        confirming={deletingBusy}
      />
    </div>
  )
}
