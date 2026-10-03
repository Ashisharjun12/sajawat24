import { useCallback, useEffect, useMemo, useState } from "react"
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { listAdmin as listAddons } from "@/api/addons.api"
import { mapProductAddon, unmapProductAddon } from "@/api/products.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
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
import { Spinner } from "@/components/ui/spinner"
import { AddonThumb } from "@/module/catalog/components/AddonThumb"
import { ColorSwatch } from "@/module/catalog/components/AddonColorField"

export function ProductAddonsCard({ productId, mappedIds, onMappedIdsChange, disabled }) {
  const deferPersistence = !productId
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")
  const [comboKey, setComboKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listAddons({ page: 1, limit: 100 })
      setItems(data.items ?? [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const mapped = useMemo(() => new Set(mappedIds || []), [mappedIds])
  const mappedRows = useMemo(
    () => items.filter((row) => mapped.has(row.id)),
    [items, mapped],
  )
  const available = useMemo(
    () => items.filter((row) => row.isActive && !mapped.has(row.id)),
    [items, mapped],
  )

  function appendMappedId(addonId) {
    onMappedIdsChange(
      [...(mappedIds || []), addonId].filter((id, index, all) => all.indexOf(id) === index),
    )
    setComboKey((key) => key + 1)
  }

  async function add(addon) {
    if (disabled || !addon?.id) return
    if (deferPersistence) {
      appendMappedId(addon.id)
      return
    }
    setBusyId(addon.id)
    setError("")
    try {
      await mapProductAddon(productId, addon.id)
      appendMappedId(addon.id)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setBusyId("")
    }
  }

  async function remove(addon) {
    if (disabled || !addon?.id) return
    if (deferPersistence) {
      onMappedIdsChange((mappedIds || []).filter((id) => id !== addon.id))
      return
    }
    setBusyId(addon.id)
    setError("")
    try {
      await unmapProductAddon(productId, addon.id)
      onMappedIdsChange((mappedIds || []).filter((id) => id !== addon.id))
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setBusyId("")
    }
  }

  const emptyHint = deferPersistence
    ? "No add-ons yet. Search and select — they are saved when you create the product."
    : "No add-ons yet. Search and select to add."

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Combobox
            key={comboKey}
            items={available}
            itemToStringLabel={(addon) =>
              addon?.color?.name ? `${addon.name} · ${addon.color.name}` : addon?.name ?? ""
            }
            itemToStringValue={(addon) => addon?.id ?? ""}
            isItemEqualToValue={(a, b) => a?.id === b?.id}
            onValueChange={(addon) => {
              if (addon) add(addon)
            }}
          >
            <ComboboxInput
              placeholder="Search and select an add-on"
              className="w-full"
              showClear
              disabled={disabled || Boolean(busyId) || available.length === 0}
            />
            <ComboboxContent className="w-(--anchor-width)">
              <ComboboxEmpty>No matching add-on</ComboboxEmpty>
              <ComboboxList>
                {(addon) => (
                  <ComboboxItem key={addon.id} value={addon}>
                    <AddonThumb addon={addon} className="size-7 rounded-full" />
                    {addon.color?.name ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <ColorSwatch hex={addon.color.hex} />
                        <span className="min-w-0 truncate">
                          {addon.name} · {addon.color.name}
                        </span>
                      </span>
                    ) : (
                      <span className="min-w-0 truncate">{addon.name}</span>
                    )}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {mappedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyHint}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedRows.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <AddonThumb addon={addon} className="rounded-full" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {addon.color?.name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <ColorSwatch hex={addon.color.hex} />
                          {addon.name} · {addon.color.name}
                        </span>
                      ) : (
                        addon.name
                      )}
                      {addon.isActive === false ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">Hidden</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{addon.slug}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={disabled || busyId === addon.id}
                              aria-label={`Actions for ${addon.name}`}
                            />
                          }
                        >
                          {busyId === addon.id ? <Spinner /> : <MoreHorizontalIcon />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => remove(addon)}
                          >
                            <Trash2Icon />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  )
}
