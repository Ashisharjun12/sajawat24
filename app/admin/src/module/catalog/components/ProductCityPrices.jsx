import { useEffect, useMemo, useState } from "react"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { defaultDiscountedRupees, toSellAndCompare } from "@/lib/money"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ListPagination } from "@/module/geo/components/ListPagination"

const PAGE_SIZE = 10

export function emptyPricePair() {
  return { regular: "", discounted: "", discountTouched: false }
}

export function pairFromCityPrice(price) {
  const sell = price.pricePaise
  const regular = price.compareAtPaise && price.compareAtPaise > sell ? price.compareAtPaise : sell
  return {
    regular: rupeesInputValueSafe(regular),
    discounted: rupeesInputValueSafe(sell),
    discountTouched: true,
  }
}

function rupeesInputValueSafe(paise) {
  const rupees = Number(paise) / 100
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}

function RupeeField({ id, label, value, onChange, placeholder = "0" }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>₹</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          inputMode="decimal"
          min="0"
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            const next = event.target.value
            if (next.startsWith("-")) return
            onChange(next)
          }}
        />
      </InputGroup>
    </Field>
  )
}

export function ProductCityPrices({ cities, template, onTemplateChange, offers, onOffersChange }) {
  const selectedIds = new Set(Object.keys(offers))
  const available = cities.filter((city) => city.isActive !== false && !selectedIds.has(city.id))
  const selectedCities = cities.filter((city) => selectedIds.has(city.id))
  const missing = Object.keys(offers)
    .filter((id) => !cities.some((city) => city.id === id))
    .map((id) => ({ id, name: "Unknown city", state: "—" }))
  const rows = [...selectedCities, ...missing]

  const [page, setPage] = useState(1)
  const [dialogCity, setDialogCity] = useState(null)
  const [draft, setDraft] = useState(emptyPricePair())
  const [dialogError, setDialogError] = useState("")
  const [deleteCity, setDeleteCity] = useState(null)

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [page, rows])

  function setTemplateField(field, value) {
    const next = { ...template, [field]: value }
    if (field === "regular" && !template.discountTouched) {
      next.discounted = defaultDiscountedRupees(value)
    }
    if (field === "discounted") next.discountTouched = true
    onTemplateChange(next)
  }

  function openForCity(city, existing) {
    setDialogCity(city)
    setDialogError("")
    setDraft(
      existing || {
        regular: template.regular,
        discounted: template.discountTouched ? template.discounted : defaultDiscountedRupees(template.regular),
        discountTouched: template.discountTouched,
      },
    )
  }

  function setDraftField(field, value) {
    const next = { ...draft, [field]: value }
    if (field === "regular" && !draft.discountTouched) {
      next.discounted = defaultDiscountedRupees(value)
    }
    if (field === "discounted") next.discountTouched = true
    setDraft(next)
  }

  function saveDialog() {
    if (!dialogCity) return
    const result = toSellAndCompare(draft.regular, draft.discounted)
    if (result.error) {
      setDialogError(result.error)
      return
    }
    onOffersChange({ ...offers, [dialogCity.id]: { ...draft, discountTouched: true } })
    setDialogCity(null)
  }

  function confirmDelete() {
    if (!deleteCity) return
    const next = { ...offers }
    delete next[deleteCity.id]
    onOffersChange(next)
    setDeleteCity(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <RupeeField
          id="template-regular"
          label="Regular price"
          value={template.regular}
          onChange={(value) => setTemplateField("regular", value)}
        />
        <RupeeField
          id="template-discounted"
          label="Discounted price"
          value={template.discounted}
          onChange={(value) => setTemplateField("discounted", value)}
        />
      </FieldGroup>
      <p className="text-sm text-muted-foreground">
        Default for every city where the platform is available. City rows below override this.
      </p>

      <Field>
        <FieldLabel>Operating cities</FieldLabel>
        {cities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cities yet. Add cities under Locations.</p>
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {rows.length ? "All active cities have an override." : "No active cities to override."}
          </p>
        ) : (
          <Combobox
            key={rows.length}
            items={available}
            itemToStringLabel={(city) => city?.name ?? ""}
            itemToStringValue={(city) => city?.id ?? ""}
            isItemEqualToValue={(a, b) => a?.id === b?.id}
            onValueChange={(city) => {
              if (city) openForCity(city)
            }}
          >
            <ComboboxInput placeholder="Search and select a city" className="w-full" showClear />
            <ComboboxContent className="w-(--anchor-width)">
              <ComboboxEmpty>No matching city</ComboboxEmpty>
              <ComboboxList>
                {(city) => (
                  <ComboboxItem key={city.id} value={city}>
                    {city.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </Field>

      {rows.length ? (
        <div className="flex flex-col gap-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Regular</TableHead>
                <TableHead>Discounted</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((city) => {
                const offer = offers[city.id] || emptyPricePair()
                return (
                  <TableRow key={city.id}>
                    <TableCell className="text-muted-foreground">{city.state || "—"}</TableCell>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>₹{offer.regular || "—"}</TableCell>
                    <TableCell>₹{offer.discounted || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${city.name}`}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openForCity(city, offer)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteCity(city)}>
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <ListPagination page={page} limit={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
        </div>
      ) : null}

      <Dialog open={Boolean(dialogCity)} onOpenChange={(open) => { if (!open) setDialogCity(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogCity?.name || "City price"}</DialogTitle>
            <DialogDescription>
              Override the default for this city. Other cities keep the default.
            </DialogDescription>
          </DialogHeader>
          {dialogError ? <p className="text-sm text-destructive">{dialogError}</p> : null}
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <RupeeField
              id="city-regular"
              label="Regular price"
              value={draft.regular}
              onChange={(value) => setDraftField("regular", value)}
            />
            <RupeeField
              id="city-discounted"
              label="Discounted price"
              value={draft.discounted}
              onChange={(value) => setDraftField("discounted", value)}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogCity(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveDialog}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteCity)} onOpenChange={(open) => { if (!open) setDeleteCity(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Would you like to delete this city price?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCity
                ? `${deleteCity.name} will use the default price again. The product stays offered there.`
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
