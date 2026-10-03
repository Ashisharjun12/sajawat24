import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sectionSchema } from "@/module/catalog/schema"
import { SectionBadgeColorField } from "@/module/catalog/components/SectionBadgeColorField"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SectionFormDialog({
  open,
  onOpenChange,
  section,
  onSubmit,
  submitting,
  error,
}) {
  const isEdit = Boolean(section)
  const form = useForm({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      slug: "",
      sortIndex: 0,
      badgeColor: "amber",
      isActive: true,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: section?.name ?? "",
      slug: section?.slug ?? "",
      sortIndex: section?.sortIndex ?? 0,
      badgeColor: section?.badgeColor ?? "amber",
      isActive: section?.isActive ?? true,
    })
  }, [open, section, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-hidden p-6 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 pr-8">
          <DialogTitle>{isEdit ? "Edit section" : "Add section"}</DialogTitle>
          <DialogDescription>
            Name, accent color, and order. Add products after you save.
          </DialogDescription>
        </DialogHeader>

        <form
          id="section-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          noValidate
        >
          <div className="scrollbar-theme min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <FieldGroup className="gap-5">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="section-name">Name</FieldLabel>
                    <Input {...field} id="section-name" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="section-slug">Slug</FieldLabel>
                    <Input
                      {...field}
                      id="section-slug"
                      placeholder="Generated from name if empty"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="badgeColor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SectionBadgeColorField
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    error={fieldState.error}
                  />
                )}
              />
              <Controller
                name="sortIndex"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="section-sort">Order</FieldLabel>
                    <Input
                      {...field}
                      id="section-sort"
                      type="number"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="section-active">Active</FieldLabel>
                    <Switch
                      id="section-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
        </form>

        <DialogFooter className="shrink-0 gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="section-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {isEdit ? "Save" : "Add section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
