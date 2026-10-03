import { useCallback, useEffect, useState } from "react"
import { LayoutListIcon, PlusIcon } from "lucide-react"
import { listAdmin as listCategories } from "@/api/categories.api"
import { listSections } from "@/api/sections.api"
import { getApiError } from "@/api/api"
import {
  createHomeLayoutBlock,
  deleteHomeLayoutBlock,
  listHomeLayoutBlocks,
  patchHomeLayoutBlock,
  reorderHomeLayoutBlocks,
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
import { HomeLayoutFormDialog } from "@/module/cms/components/HomeLayoutFormDialog"
import { HomeLayoutTable } from "@/module/cms/components/HomeLayoutTable"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"

const GLOBAL = "global"

async function loadCategoryOptions() {
  const parents = await listCategories({ parentId: null, limit: 100, isActive: "true" })
  return (parents.items ?? []).map((parent) => ({
    ...parent,
    label: parent.name,
  }))
}

export function HomeLayoutPanel({ cities }) {
  const [scopeCityId, setScopeCityId] = useState(GLOBAL)
  const [items, setItems] = useState([])
  const [sections, setSections] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
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
      const data = await listHomeLayoutBlocks({ cityId: scopeCityId })
      setItems(data.items ?? [])
    } catch (err) {
      setItems([])
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [scopeCityId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    listSections()
      .then((data) => setSections(data.items ?? []))
      .catch(() => setSections([]))
    loadCategoryOptions()
      .then(setCategoryOptions)
      .catch(() => setCategoryOptions([]))
  }, [])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setDialogOpen(true)
  }

  async function handleSubmit(body) {
    setSubmitting(true)
    try {
      if (editing?.id) {
        const { type: _type, ...patchBody } = body
        await patchHomeLayoutBlock(editing.id, patchBody)
        toast.add({ title: "Block updated", type: "success" })
      } else {
        await createHomeLayoutBlock(body)
        toast.add({ title: "Block created", type: "success" })
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
      await deleteHomeLayoutBlock(deleting.id)
      toast.add({ title: "Block deleted", type: "success" })
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
      await reorderHomeLayoutBlocks({
        cityId: scopeCityId === GLOBAL ? null : scopeCityId,
        ids: orderedIds,
      })
      toast.add({ title: "Order updated", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
      await load()
    } finally {
      setReordering(false)
    }
  }

  const empty = !loading && !error && items.length === 0
  const scopeLabel =
    scopeCityId === GLOBAL
      ? "Global"
      : cities.find((city) => city.id === scopeCityId)?.name ?? "City"

  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Ordered blocks below the hero (categories and package rails). When a city has any published block,
        only that city&apos;s layout is shown — duplicate global blocks for a full city homepage. Banners
        (top / mid / end) stay under the Banners tab.
      </p>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={scopeCityId} onValueChange={setScopeCityId}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue placeholder="Scope">
              {scopeCityId === GLOBAL
                ? "Global layout"
                : cities.find((city) => city.id === scopeCityId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GLOBAL}>Global layout</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!empty ? (
          <Button type="button" size="sm" className="ml-auto" onClick={openCreate}>
            <PlusIcon />
            Add block
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag rows to set order for {scopeLabel} layout.
      </p>

      {empty ? (
        <CmsEmptyState
          icon={LayoutListIcon}
          title="No homepage blocks"
          description="Add category rows and package rails for this scope."
          actionLabel="Add block"
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

      <HomeLayoutFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        cities={cities}
        scopeCityId={scopeCityId}
        sections={sections}
        categoryOptions={categoryOptions}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete homepage block?"
        description="This block will be removed from the layout."
        onConfirm={confirmDelete}
        confirming={deletingBusy}
      />
    </div>
  )
}
