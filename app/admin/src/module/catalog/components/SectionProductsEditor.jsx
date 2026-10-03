import { useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon, LayoutListIcon, PlusIcon } from "lucide-react"
import { putSectionProducts, deleteSectionCityOverride } from "@/api/sections.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { SectionProductPickerDialog } from "@/module/catalog/components/SectionProductPickerDialog"
import { cn } from "@/lib/utils"
import { SECTION_PRODUCT_MAX } from "@/module/catalog/lib/global-section-membership"

const MAX = SECTION_PRODUCT_MAX

function coverSrc(product) {
  const cover = (product?.images ?? []).find((item) => item.kind === "image") ?? product?.images?.[0]
  return cover?.thumbnailUrl || cover?.url || cover?.publicUrl || cover?.optimizedUrl || ""
}

function SortableProductRow({ item, disabled, removing, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.productId,
    disabled,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const src = coverSrc(item.product)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-3 py-2",
        isDragging && "opacity-70",
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground disabled:opacity-40"
        disabled={disabled}
        aria-label={`Reorder ${item.product?.name ?? "product"}`}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
        {src ? (
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <DecoryImageFallback />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.product?.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.product?.slug}
          {item.product?.isActive === false ? " · Hidden" : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="min-w-[5.75rem] gap-1.5"
        disabled={disabled || removing}
        aria-busy={removing}
        aria-label={
          removing
            ? `Removing ${item.product?.name ?? "product"}`
            : `Remove ${item.product?.name ?? "product"}`
        }
        onClick={() => onRemove(item.productId)}
      >
        {removing ? (
          <>
            <Spinner className="size-3.5" />
            Removing…
          </>
        ) : (
          "Remove"
        )}
      </Button>
    </div>
  )
}

export function SectionProductsEditor({ sectionId, cityId, membership, onMembershipChange }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const source = membership?.source ?? "global"
  const items = membership?.items ?? []
  const inheriting = Boolean(cityId) && source === "global"
  const editable = !inheriting
  const ids = items.map((row) => row.productId)
  const slotsLeft = Math.max(0, MAX - ids.length)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function persist(productIds, { removingProductId = null } = {}) {
    setBusy(true)
    if (removingProductId) {
      setRemovingId(removingProductId)
    }
    try {
      const data = await putSectionProducts(sectionId, {
        cityId: cityId || null,
        productIds,
      })
      onMembershipChange(data)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setBusy(false)
      setRemovingId(null)
    }
  }

  async function addMany(products) {
    if (!editable || !products?.length) return
    const newIds = products.map((product) => product.id).filter((id) => id && !ids.includes(id))
    if (!newIds.length) return
    if (ids.length + newIds.length > MAX) {
      toast.add({ title: `A section can have at most ${MAX} products`, type: "error" })
      return
    }
    await persist([...ids, ...newIds])
    toast.add({
      title: `${newIds.length} product${newIds.length === 1 ? "" : "s"} added`,
      type: "success",
    })
  }

  async function remove(productId) {
    if (!editable || busy) return
    await persist(
      ids.filter((id) => id !== productId),
      { removingProductId: productId },
    )
  }

  async function onDragEnd(event) {
    const { active, over } = event
    if (!editable || busy || !over || active.id === over.id) return
    const from = ids.indexOf(active.id)
    const to = ids.indexOf(over.id)
    if (from < 0 || to < 0) return
    await persist(arrayMove(ids, from, to))
  }

  async function customize() {
    setBusy(true)
    try {
      const data = await putSectionProducts(sectionId, {
        cityId,
        productIds: ids,
      })
      onMembershipChange(data)
      toast.add({ title: "City list created", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setBusy(false)
    }
  }

  async function revert() {
    if (!cityId) return
    setBusy(true)
    try {
      const data = await deleteSectionCityOverride(sectionId, cityId)
      onMembershipChange(data)
      toast.add({ title: "Using global list", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {inheriting ? (
        <Alert>
          <AlertTitle>Using global list</AlertTitle>
          <AlertDescription>
            This city inherits the global section. Customize to replace it, including an empty list to hide the section here.
          </AlertDescription>
          <AlertAction>
            <Button type="button" size="sm" onClick={customize} disabled={busy}>
              {busy ? <Spinner /> : null}
              Customize for this city
            </Button>
          </AlertAction>
        </Alert>
      ) : cityId ? (
        <Alert>
          <AlertTitle>City list</AlertTitle>
          <AlertDescription>
            This replaces the global section for the selected city. An empty list hides the section there.
          </AlertDescription>
          <AlertAction>
            <Button type="button" size="sm" variant="outline" onClick={revert} disabled={busy}>
              Revert to global
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {editable ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {ids.length} / {MAX} products
            {slotsLeft === 0 ? " · section full" : ""}
          </p>
          <Button
            type="button"
            size="sm"
            disabled={busy || slotsLeft === 0}
            onClick={() => setPickerOpen(true)}
          >
            <PlusIcon />
            Add products
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutListIcon />
            </EmptyMedia>
            <EmptyTitle>{inheriting ? "Global list is empty" : "No products in this section"}</EmptyTitle>
            <EmptyDescription>
              {inheriting
                ? "Add products on Global, or customize this city."
                : cityId
                  ? "This city section is empty, so it will be hidden on the public home."
                  : "Add products with search and filters, then drag to set order."}
            </EmptyDescription>
          </EmptyHeader>
          {editable && slotsLeft > 0 ? (
            <Button type="button" size="sm" disabled={busy} onClick={() => setPickerOpen(true)}>
              <PlusIcon />
              Add products
            </Button>
          ) : null}
        </Empty>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <SortableProductRow
                  key={item.productId}
                  item={item}
                  disabled={!editable || busy}
                  removing={removingId === item.productId}
                  onRemove={remove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SectionProductPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentSectionId={sectionId}
        enforceGlobalExclusive={!cityId}
        excludeIds={ids}
        maxAdd={slotsLeft}
        onConfirm={addMany}
      />
    </div>
  )
}
