import { useCallback, useEffect, useMemo, useState } from "react"
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
import { MobilePhonePreview } from "@/module/cms/components/MobilePhonePreview"

const GLOBAL = "global"
const ANDROID_PLATFORM = "android"

function isAndroidBlock(row) {
  const platforms = row?.platforms ?? []
  return platforms.includes(ANDROID_PLATFORM)
}

async function loadCategoryOptions() {
  const parents = await listCategories({ parentId: null, limit: 100, isActive: "true" })
  return (parents.items ?? []).map((parent) => ({
    ...parent,
    label: parent.name,
  }))
}

export function AppHomeLayoutPanel({ cities = [] }) {
  const [scopeCityId, setScopeCityId] = useState(GLOBAL)
  const [allItems, setAllItems] = useState([])
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

  const items = useMemo(() => allItems.filter(isAndroidBlock), [allItems])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listHomeLayoutBlocks({ cityId: scopeCityId })
      setAllItems(data.items ?? [])
    } catch (err) {
      setAllItems([])
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
      const payload = { ...body, platforms: [ANDROID_PLATFORM] }
      if (editing?.id) {
        const { type: _type, ...patchBody } = payload
        await patchHomeLayoutBlock(editing.id, patchBody)
        toast.add({ title: "Block updated", type: "success" })
      } else {
        await createHomeLayoutBlock(payload)
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

  function mergeAndroidReorder(androidOrderedIds) {
    const sorted = [...allItems].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    const merged = []
    let androidIndex = 0
    for (const row of sorted) {
      if (isAndroidBlock(row)) {
        if (androidIndex < androidOrderedIds.length) {
          merged.push(androidOrderedIds[androidIndex])
          androidIndex += 1
        }
      } else {
        merged.push(row.id)
      }
    }
    while (androidIndex < androidOrderedIds.length) {
      merged.push(androidOrderedIds[androidIndex])
      androidIndex += 1
    }
    return merged
  }

  async function handleReorder(orderedIds) {
    const fullOrder = mergeAndroidReorder(orderedIds)
    setAllItems((prev) => {
      const sortMap = new Map(fullOrder.map((id, index) => [id, index]))
      return [...prev].sort(
        (a, b) => (sortMap.get(a.id) ?? 999) - (sortMap.get(b.id) ?? 999),
      )
    })
    setReordering(true)
    try {
      await reorderHomeLayoutBlocks({
        cityId: scopeCityId === GLOBAL ? null : scopeCityId,
        ids: fullOrder,
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
    <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Ordered blocks below the hero on the Android app: category row (horizontal square tiles)
          and package rails. City-specific layouts override global when published. Hero slides stay
          under the Banners tab.
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
          Drag rows to set order for {scopeLabel} Android layout.
        </p>

        {empty ? (
          <CmsEmptyState
            icon={LayoutListIcon}
            title="No Android homepage blocks"
            description="Add a category row and package rails for the customer app home feed."
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
          channel="app"
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
          description="This block will be removed from the Android app home layout."
          onConfirm={confirmDelete}
          confirming={deletingBusy}
        />
      </div>

      <MobilePhonePreview className="lg:sticky lg:top-4" />
    </div>
  )
}
