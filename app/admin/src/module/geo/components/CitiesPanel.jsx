import { useCallback, useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { listAdmin, createCity, patchCity } from "@/api/cities.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MapSilhouette } from "@/assets/silhouettes"
import { CitiesTable } from "@/module/geo/components/CitiesTable"
import { CityFormDialog } from "@/module/geo/components/CityFormDialog"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { CityFilters } from "@/module/geo/filters/CityFilters"

const LIMIT = 20

export function CitiesPanel() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [isActive, setIsActive] = useState("")
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const filtered = Boolean(q.trim()) || isActive !== ""

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listAdmin({
        page,
        limit: LIMIT,
        q: q.trim() || undefined,
        isActive: isActive || undefined,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page, q, isActive])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setFormError("")
    setDialogOpen(true)
  }

  function openEdit(city) {
    setEditing(city)
    setFormError("")
    setDialogOpen(true)
  }

  async function onToggleActive(city, nextActive) {
    try {
      await patchCity(city.id, { isActive: nextActive })
      toast.add({ title: "City updated", type: "success" })
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  async function onSubmit(values) {
    setSubmitting(true)
    setFormError("")
    const body = {
      name: values.name,
      state: values.state,
      isActive: values.isActive,
      imageUploadId: values.image?.uploadId || null,
      ...(values.slug ? { slug: values.slug } : {}),
    }
    try {
      if (editing) {
        await patchCity(editing.id, body)
        toast.add({ title: "City updated", type: "success" })
      } else {
        await createCity(body)
        toast.add({ title: "City created", type: "success" })
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      setFormError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const empty = !loading && items.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CityFilters
          q={q}
          isActive={isActive}
          onQ={(value) => {
            setPage(1)
            setQ(value)
          }}
          onIsActive={(value) => {
            setPage(1)
            setIsActive(value)
          }}
        />
        <Button type="button" onClick={openCreate}>
          <PlusIcon />
          Add city
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia>
              <MapSilhouette className="h-28 w-40 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{filtered ? "No cities match" : "No cities yet"}</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Try a different name or status."
                : "Add the first city Decory serves."}
            </EmptyDescription>
          </EmptyHeader>
          {filtered ? null : (
            <EmptyContent>
              <Button type="button" onClick={openCreate}>
                Add city
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          <CitiesTable
            items={items}
            loading={loading}
            onEdit={openEdit}
            onToggleActive={onToggleActive}
          />
          <ListPagination
            page={page}
            limit={LIMIT}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <CityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        city={editing}
        onSubmit={onSubmit}
        submitting={submitting}
        error={formError}
      />
    </div>
  )
}
