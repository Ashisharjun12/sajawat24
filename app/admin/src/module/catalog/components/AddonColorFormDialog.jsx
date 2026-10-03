import { useEffect, useState } from "react"
import { createAddonColor, patchAddonColor } from "@/api/addons.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const DEFAULT_HEX = "#888888"

function HexInput({ value, onChange, disabled, id, "aria-label": ariaLabel }) {
  return (
    <input
      id={id}
      type="color"
      value={value || DEFAULT_HEX}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}

export function AddonColorFormDialog({ open, onOpenChange, color, colors = [], onSaved, disabled }) {
  const isEdit = Boolean(color)
  const [name, setName] = useState("")
  const [hex, setHex] = useState(DEFAULT_HEX)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const trimmed = name.trim()
  const exists = colors.some(
    (item) => item.id !== color?.id && item.name.toLowerCase() === trimmed.toLowerCase(),
  )
  const canSave = trimmed.length >= 2 && !exists && !submitting && !disabled

  useEffect(() => {
    if (!open) return
    setName(color?.name ?? "")
    setHex(color?.hex || DEFAULT_HEX)
    setError("")
  }, [open, color])

  async function submit(event) {
    event.preventDefault()
    if (!canSave) return
    setSubmitting(true)
    setError("")
    try {
      const saved = isEdit
        ? await patchAddonColor(color.id, { name: trimmed, hex })
        : await createAddonColor({ name: trimmed, hex })
      onSaved?.(saved)
      onOpenChange(false)
      toast.add({ title: isEdit ? "Color updated" : "Color created", type: "success" })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit color" : "Create color"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Name and swatch apply to every add-on using this color."
              : "Name the swatch and pick a color. You can reuse it on any add-on."}
          </DialogDescription>
        </DialogHeader>
        <form id="addon-color-form" className="grid gap-4" onSubmit={submit} noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Field>
            <FieldLabel htmlFor="addon-color-name">Name</FieldLabel>
            <Input
              id="addon-color-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="Red"
              autoFocus
              disabled={disabled || submitting}
            />
            {exists ? (
              <p className="text-sm text-destructive">A color with this name already exists.</p>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="addon-color-hex">Swatch</FieldLabel>
            <div className="flex items-center gap-2">
              <HexInput
                id="addon-color-hex"
                value={hex}
                onChange={setHex}
                disabled={submitting || disabled}
                aria-label="Color swatch"
              />
              <span className="text-sm text-muted-foreground">{(hex || DEFAULT_HEX).toLowerCase()}</span>
            </div>
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="addon-color-form" disabled={!canSave}>
            {submitting ? <Spinner /> : null}
            {isEdit ? "Save" : "Create color"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
