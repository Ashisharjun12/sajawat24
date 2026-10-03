import { PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"

const MAX = 20

export function PointListEditor({
  items,
  onChange,
  disabled,
  addLabel = "Add point",
  emptyTitle,
  emptyDescription,
  icon,
}) {
  function add() {
    if (disabled || items.length >= MAX) return
    onChange([...items, ""])
  }

  function update(index, value) {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  if (!items.length) {
    return (
      <Empty className="border py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" disabled={disabled} onClick={add}>
            <PlusIcon />
            {addLabel}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(event) => update(index, event.target.value)}
            disabled={disabled}
            maxLength={200}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => remove(index)}
            aria-label="Remove point"
          >
            <XIcon />
          </Button>
        </div>
      ))}
      {items.length < MAX ? (
        <Button type="button" variant="outline" className="self-start" disabled={disabled} onClick={add}>
          <PlusIcon />
          {addLabel}
        </Button>
      ) : null}
    </div>
  )
}
