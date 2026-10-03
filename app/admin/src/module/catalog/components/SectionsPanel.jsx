import { useCallback, useEffect, useState } from "react"
import { ChevronLeftIcon, LayoutListIcon, PlusIcon } from "lucide-react"
import { format } from "date-fns"
import {
  createSection,
  deleteSection,
  listSectionProducts,
  listSections,
  patchSection,
} from "@/api/sections.api"
import { listAdmin as listCities } from "@/api/cities.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { SectionFormDialog } from "@/module/catalog/components/SectionFormDialog"
import { SectionProductsEditor } from "@/module/catalog/components/SectionProductsEditor"
import { SectionFilters } from "@/module/catalog/filters/SectionFilters"
import { AdminInfoTip } from "@/components/admin-info-tip"

const GLOBAL = "global"
const SECTIONS_PANEL_INFO =
  "Each global section becomes one home rail. A product can only be in one global section."

export function SectionsPanel() {
  const [items, setItems] = useState([])
  const [cities, setCities] = useState([])
  const [q, setQ] = useState("")
  const [isActive, setIsActive] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState(null)
  const [cityId, setCityId] = useState(GLOBAL)
  const [membership, setMembership] = useState(null)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [sections, cityPage] = await Promise.all([
        listSections(),
        listCities({ page: 1, limit: 100, isActive: "true" }),
      ])
      setItems(sections.items ?? [])
      setCities(cityPage.items ?? [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selected) return
    const next = items.find((row) => row.id === selected.id)
    if (next && next !== selected) setSelected(next)
  }, [items, selected])

  const loadMembership = useCallback(async () => {
    if (!selected) {
      setMembership(null)
      return
    }
    setMembershipLoading(true)
    try {
      const data = await listSectionProducts(selected.id, cityId === GLOBAL ? undefined : cityId)
      setMembership(data)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setMembershipLoading(false)
    }
  }, [selected, cityId])

  useEffect(() => {
    loadMembership()
  }, [loadMembership])

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

  async function onToggleActive(row, nextActive) {
    try {
      await patchSection(row.id, { isActive: nextActive })
      toast.add({ title: "Section updated", type: "success" })
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
      sortIndex: values.sortIndex,
      badgeColor: values.badgeColor,
      isActive: values.isActive,
      ...(values.slug ? { slug: values.slug } : {}),
    }
    try {
      if (editing) {
        await patchSection(editing.id, body)
        toast.add({ title: "Section updated", type: "success" })
        setDialogOpen(false)
        await load()
        return
      }
      const created = await createSection(body)
      toast.add({ title: "Section created", type: "success" })
      setDialogOpen(false)
      await load()
      setSelected(created)
      setCityId(GLOBAL)
    } catch (err) {
      setFormError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteSection(deleting.id)
      toast.add({ title: "Section deleted", type: "success" })
      if (selected?.id === deleting.id) setSelected(null)
      setDeleting(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  const needle = q.trim().toLowerCase()
  const filtered = Boolean(needle) || isActive !== ""
  const visible = items.filter((row) => {
    if (needle && !row.name.toLowerCase().includes(needle) && !row.slug.toLowerCase().includes(needle)) {
      return false
    }
    if (isActive === "true") return row.isActive
    if (isActive === "false") return !row.isActive
    return true
  })
  const empty = !loading && visible.length === 0

  if (selected) {
    const cityLabel =
      cityId === GLOBAL ? "Global" : cities.find((city) => city.id === cityId)?.name || "City"

    return (
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ChevronLeftIcon />
              Sections
            </Button>
            <p className="text-sm text-muted-foreground">
              {selected.name} · {cityLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Scope">{cityLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GLOBAL}>Global</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => openEdit(selected)}>
              <PencilIcon />
              Edit section
            </Button>
          </div>
        </div>

        {membershipLoading || !membership ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <SectionProductsEditor
            sectionId={selected.id}
            cityId={cityId === GLOBAL ? null : cityId}
            membership={membership}
            onMembershipChange={setMembership}
          />
        )}

        <SectionFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          section={editing}
          onSubmit={onSubmit}
          submitting={submitting}
          error={formError}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="flex items-center gap-0.5 text-sm font-medium text-foreground">
        Home sections
        <AdminInfoTip content={SECTIONS_PANEL_INFO} />
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionFilters
          q={q}
          isActive={isActive}
          onQ={setQ}
          onIsActive={setIsActive}
        />
        <Button type="button" onClick={openCreate}>
          <PlusIcon />
          Add section
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
              <LayoutListIcon />
            </EmptyMedia>
            <EmptyTitle>{filtered ? "No sections match" : "No sections yet"}</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Try a different name or status."
                : "Create Trending, Popular, or any section, then pick products."}
            </EmptyDescription>
          </EmptyHeader>
          {filtered ? null : (
            <EmptyContent>
              <Button type="button" onClick={openCreate}>
                <PlusIcon />
                Add section
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((section) => (
              <TableRow
                key={section.id}
                className="cursor-pointer"
                onClick={() => {
                  setCityId(GLOBAL)
                  setSelected(section)
                }}
              >
                <TableCell className="font-medium">{section.name}</TableCell>
                <TableCell className="text-muted-foreground">{section.slug}</TableCell>
                <TableCell className="text-muted-foreground">{section.sortIndex}</TableCell>
                <TableCell>
                  <Switch
                    checked={section.isActive}
                    onCheckedChange={(checked) => onToggleActive(section, checked)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Set ${section.name} ${section.isActive ? "inactive" : "active"}`}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {section.updatedAt ? format(new Date(section.updatedAt), "d MMM yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${section.name}`}
                          onClick={(event) => event.stopPropagation()}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(section)}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(section)}>
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        section={editing}
        onSubmit={onSubmit}
        submitting={submitting}
        error={formError}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `“${deleting.name}” and its global and city product lists will be removed.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
