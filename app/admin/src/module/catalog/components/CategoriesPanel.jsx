import { useCallback, useEffect, useState } from "react"
import { ChevronLeftIcon, PlusIcon, FolderTreeIcon, TagsIcon } from "lucide-react"
import { listAdmin, createCategory, patchCategory } from "@/api/categories.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoriesTable } from "@/module/catalog/components/CategoriesTable"
import { CategoryFormDialog } from "@/module/catalog/components/CategoryFormDialog"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

function useCategoryList({ parentId, enabled = true }) {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [isActive, setIsActive] = useState("")
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState("")

  const filtered = Boolean(q.trim()) || isActive !== ""

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([])
      setTotal(0)
      setLoading(false)
      setError("")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await listAdmin({
        page,
        limit: LIMIT,
        q: q.trim() || undefined,
        isActive: isActive || undefined,
        parentId,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [enabled, page, q, isActive, parentId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
    setQ("")
    setIsActive("")
  }, [parentId])

  return {
    page,
    setPage,
    q,
    setQ,
    isActive,
    setIsActive,
    items,
    total,
    loading,
    error,
    filtered,
    load,
  }
}

export function CategoriesPanel() {
  const [selected, setSelected] = useState(null)
  const parents = useCategoryList({ parentId: null })
  const children = useCategoryList({
    parentId: selected?.id,
    enabled: Boolean(selected?.id),
  })
  const list = selected ? children : parents
  const kind = selected ? "subcategory" : "category"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogKind, setDialogKind] = useState("category")
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!selected) return
    const next = parents.items.find((row) => row.id === selected.id)
    if (next && next !== selected) {
      setSelected(next)
    }
  }, [parents.items, selected])

  function openCreate() {
    setDialogKind(kind)
    setEditing(null)
    setFormError("")
    setDialogOpen(true)
  }

  function openEdit(row) {
    setDialogKind(kind)
    setEditing(row)
    setFormError("")
    setDialogOpen(true)
  }

  async function onToggleActive(row, nextActive) {
    try {
      await patchCategory(row.id, { isActive: nextActive })
      toast.add({ title: "Category updated", type: "success" })
      await list.load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  async function onSubmit(values) {
    setSubmitting(true)
    setFormError("")
    const body = {
      name: values.name,
      isActive: values.isActive,
      imageUploadId: values.image?.uploadId || null,
      ...(values.slug ? { slug: values.slug } : {}),
    }
    if (dialogKind === "subcategory") {
      body.parentId = selected?.id ?? null
    } else {
      if (!editing) {
        body.parentId = null
      }
      body.iconKey = values.iconKey
      body.iconTone = values.iconTone
    }
    try {
      if (editing) {
        await patchCategory(editing.id, body)
        toast.add({ title: "Category updated", type: "success" })
        setDialogOpen(false)
        await list.load()
        return
      }
      const created = await createCategory(body)
      toast.add({
        title: dialogKind === "subcategory" ? "Subcategory created" : "Category created",
        type: "success",
      })
      setDialogOpen(false)
      if (dialogKind === "category") {
        setSelected(created)
        await parents.load()
      } else {
        await children.load()
      }
    } catch (err) {
      setFormError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const empty = !list.loading && list.items.length === 0
  const addLabel = selected ? "Add subcategory" : "Add category"
  const emptyTitle = list.filtered
    ? selected
      ? "No subcategories match"
      : "No categories match"
    : selected
      ? "No subcategories yet"
      : "No categories yet"
  const emptyDescription = list.filtered
    ? "Try a different name or status."
    : selected
      ? `Add the first subcategory under ${selected.name}.`
      : "Add Birthday Decor, Anniversary, and similar groups."

  return (
    <div className="flex flex-col gap-4 pt-4">
      {selected ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ChevronLeftIcon />
            Categories
          </Button>
          <p className="text-sm text-muted-foreground">
            Subcategories · {selected.name}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-56"
            value={list.q}
            onChange={(event) => {
              list.setPage(1)
              list.setQ(event.target.value)
            }}
            placeholder="Search by name"
            aria-label={selected ? "Search subcategories" : "Search categories"}
          />
          <Select
            value={list.isActive || "all"}
            onValueChange={(value) => {
              list.setPage(1)
              list.setIsActive(value === "all" ? "" : value)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All">
                {list.isActive === "true"
                  ? "Active"
                  : list.isActive === "false"
                    ? "Inactive"
                    : "All"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon />
          {addLabel}
        </Button>
      </div>

      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {selected ? <FolderTreeIcon /> : <TagsIcon />}
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
          {list.filtered ? null : (
            <EmptyContent>
              <Button type="button" onClick={openCreate}>
                {addLabel}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <CategoriesTable
            items={list.items}
            loading={list.loading}
            onOpen={selected ? undefined : setSelected}
            onEdit={openEdit}
            onToggleActive={onToggleActive}
          />
          <ListPagination
            page={list.page}
            limit={LIMIT}
            total={list.total}
            onPageChange={list.setPage}
          />
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        kind={dialogKind}
        parentName={selected?.name}
        onSubmit={onSubmit}
        submitting={submitting}
        error={formError}
      />
    </div>
  )
}
