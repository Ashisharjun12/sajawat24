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
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
})

export function FolderFormDialog({ open, onOpenChange, folder, onSubmit, submitting, error }) {
  const isEdit = Boolean(folder)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ name: folder?.name ?? "" })
  }, [open, folder, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit folder" : "New folder"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Rename this folder."
              : "Create a top-level folder for your media library."}
          </DialogDescription>
        </DialogHeader>
        <form id="folder-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="folder-name">Name</FieldLabel>
                  <Input {...field} id="folder-name" placeholder="products" />
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
          <Button type="submit" form="folder-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
