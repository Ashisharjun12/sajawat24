import { useCallback, useEffect, useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"
import { listAdmin as listCities } from "@/api/cities.api"
import { listAdmin, createPincode, patchPincode } from "@/api/pincodes.api"
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
import { PincodesTable } from "@/module/geo/components/PincodesTable"
import { PincodeFormDialog } from "@/module/geo/components/PincodeFormDialog"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { PincodeFilters } from "@/module/geo/filters/PincodeFilters"

const LIMIT = 20

export function PincodesPanel() {
  const [page, setPage] = useState(1)
  const [cityId, setCityId] = useState("")
  const [q, setQ] = useState("")
  const [isServiceable, setIsServiceable] = useState("")
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const citiesById = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities])
  const filtered = Boolean(q.trim()) || isServiceable !== "" || Boolean(cityId)

  useEffect(() => {
    listCities({ page: 1, limit: 100 })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listAdmin({
        page,
        limit: LIMIT,
        cityId: cityId || undefined,
        q: q.trim() || undefined,
        isServiceable: isServiceable || undefined,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page, cityId, q, isServiceable])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setFormError("")
    setDialogOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setFormError("")
    setDialogOpen(true)
  }

  async function onToggleServiceable(row, nextServiceable) {
    try {
      await patchPincode(row.id, { isServiceable: nextServiceable })
      toast.add({ title: "Pincode updated", type: "success" })
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  async function onSubmit(values) {
    setSubmitting(true)
    setFormError("")
    try {
      if (editing) {
        await patchPincode(editing.id, {
          cityId: values.cityId,
          locality: values.locality || null,
          isServiceable: values.isServiceable,
        })
        toast.add({ title: "Pincode updated", type: "success" })
      } else {
        await createPincode({
          code: values.code,
          cityId: values.cityId,
          locality: values.locality || undefined,
          isServiceable: values.isServiceable,
        })
        toast.add({ title: "Pincode created", type: "success" })
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
        <PincodeFilters
          q={q}
          cityId={cityId}
          isServiceable={isServiceable}
          cities={cities}
          onQ={(value) => {
            setPage(1)
            setQ(value)
          }}
          onCityId={(value) => {
            setPage(1)
            setCityId(value)
          }}
          onIsServiceable={(value) => {
            setPage(1)
            setIsServiceable(value)
          }}
        />
        <Button type="button" onClick={openCreate}>
          <PlusIcon />
          Add pincode
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
            <EmptyTitle>{filtered ? "No pincodes match" : "No pincodes yet"}</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Try a different PIN, city, or serviceable status."
                : "Add a PIN we actually serve."}
            </EmptyDescription>
          </EmptyHeader>
          {filtered ? null : (
            <EmptyContent>
              <Button type="button" onClick={openCreate}>
                Add pincode
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          <PincodesTable
            items={items}
            citiesById={citiesById}
            loading={loading}
            onEdit={openEdit}
            onToggleServiceable={onToggleServiceable}
          />
          <ListPagination
            page={page}
            limit={LIMIT}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <PincodeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pincode={editing}
        cities={cities}
        onSubmit={onSubmit}
        submitting={submitting}
        error={formError}
      />
    </div>
  )
}
