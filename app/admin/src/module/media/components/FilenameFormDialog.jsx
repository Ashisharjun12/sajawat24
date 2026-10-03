import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

const schema = z.object({
  filename: z.string().trim().min(1, "Filename is required").max(80, "Filename is too long"),
})

export function FilenameFormDialog({ open, onOpenChange, item, onSubmit, submitting, error }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { filename: "" },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ filename: item?.filename ?? "" })
  }, [open, item, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit filename</DialogTitle>
          <DialogDescription>
            Rename this file in the library. The stored file stays the same.
          </DialogDescription>
        </DialogHeader>
        <form id="filename-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Controller
              name="filename"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="file-filename">Filename</FieldLabel>
                  <Input {...field} id="file-filename" placeholder="banner.webp" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="filename-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
