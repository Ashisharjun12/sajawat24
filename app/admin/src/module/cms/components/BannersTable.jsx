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
import { GripVerticalIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { PLACEMENT_LABELS } from "@/module/cms/lib/cms-constants"
import { cn } from "@/lib/utils"

function statusBadge(status) {
  if (status === "published") return <Badge className="text-xs">Published</Badge>
  if (status === "hidden") return <Badge variant="secondary" className="text-xs">Hidden</Badge>
  return <Badge variant="outline" className="text-xs">Draft</Badge>
}

function SortableBannerRow({ row, sortable, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !sortable,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(isDragging && "opacity-70")}>
      <TableCell className="w-10">
        {sortable ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Reorder ${row.title || "banner"}`}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="size-4" />
          </button>
        ) : null}
      </TableCell>
      <TableCell>
        {row.imageUrl ? (
          <img src={row.imageUrl} alt="" className="size-10 rounded object-cover" />
        ) : (
          <div className="size-10 rounded bg-muted" />
        )}
      </TableCell>
      <TableCell className="max-w-xs truncate font-medium">{row.title || "Untitled banner"}</TableCell>
      <TableCell className="text-muted-foreground">{PLACEMENT_LABELS[row.placement]}</TableCell>
      <TableCell>{row.cityName ?? "Global"}</TableCell>
      <TableCell>{statusBadge(row.status)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function BannersTable({ items, sortable = false, onReorder, onEdit, onDelete }) {
  const ids = items.map((row) => row.id)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(event) {
    const { active, over } = event
    if (!sortable || !over || active.id === over.id) return
    const from = ids.indexOf(active.id)
    const to = ids.indexOf(over.id)
    if (from < 0 || to < 0) return
    onReorder?.(arrayMove(ids, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="overflow-hidden rounded-md border">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {items.map((row) => (
                <SortableBannerRow
                  key={row.id}
                  row={row}
                  sortable={sortable}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>
    </DndContext>
  )
}
