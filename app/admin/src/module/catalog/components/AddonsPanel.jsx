import { useCallback, useEffect, useState } from "react"
import { PlusIcon, SparklesIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { listAdmin as listAddons, patchAddon } from "@/api/addons.api"
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
import { AddonsTable } from "@/module/catalog/components/AddonsTable"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

export function AddonsPanel() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [isActive, setIsActive] = useState("")
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const filtered = Boolean(q.trim()) || isActive !== ""

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const data = await listAddons({
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
      if (!silent) setLoading(false)
    }
  }, [page, q, isActive])

  useEffect(() => {
    load()
  }, [load])

  async function onToggleVisible(addon, nextActive) {
    const previous = items
    setItems((rows) =>
      rows.map((row) => (row.id === addon.id ? { ...row, isActive: nextActive } : row)),
    )
    try {
      await patchAddon(addon.id, { isActive: nextActive })
      toast.add({
        title: nextActive ? "Add-on visible" : "Add-on hidden",
        type: "success",
      })
      await load({ silent: true })
    } catch (err) {
      setItems(previous)
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  const empty = !loading && items.length === 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-56"
            value={q}
            onChange={(event) => {
              setPage(1)
              setQ(event.target.value)
            }}
            placeholder="Search by name"
            aria-label="Search add-ons"
          />
          <Select
            value={isActive || "all"}
            onValueChange={(value) => {
              setPage(1)
              setIsActive(value === "all" ? "" : value)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All">
                {isActive === "true" ? "Visible" : isActive === "false" ? "Hidden" : "All"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Visible</SelectItem>
              <SelectItem value="false">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={() => navigate("/catalog/addons/new")}>
          <PlusIcon />
          Add add-on
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
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>{filtered ? "No add-ons match" : "No add-ons yet"}</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Try a different name or visibility."
                : "Create extras like balloon colors or cake, then map them on a product."}
            </EmptyDescription>
          </EmptyHeader>
          {filtered ? null : (
            <EmptyContent>
              <Button type="button" onClick={() => navigate("/catalog/addons/new")}>
                Add add-on
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <AddonsTable items={items} loading={loading} onToggleVisible={onToggleVisible} />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
