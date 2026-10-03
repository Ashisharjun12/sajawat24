import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CATEGORY_ICON_KEYS,
  CATEGORY_ICON_LABELS,
  CATEGORY_ICON_TONES,
  categorySchema,
} from "@/module/catalog/schema"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { CategoryImageField } from "@/module/catalog/components/CategoryImageField"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  kind = "category",
  parentName,
  onSubmit,
  submitting,
  error,
}) {
  const isEdit = Boolean(category)
  const isSub = kind === "subcategory"
  const [image, setImage] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      iconKey: "sparkles",
      iconTone: "amber",
      isActive: true,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      iconKey: category?.iconKey ?? "sparkles",
      iconTone: category?.iconTone ?? "amber",
      isActive: category?.isActive ?? true,
    })
    setImage(category?.image ? toGalleryItem(category.image) : null)
    setPickerOpen(false)
  }, [open, category, form])

  const title = isEdit
    ? isSub
      ? "Edit subcategory"
      : "Edit category"
    : isSub
      ? "Add subcategory"
      : "Add category"

  const description = isEdit
    ? "Inactive rows are hidden from the public catalog tree."
    : isSub
      ? `Nested under ${parentName || "the selected category"}.`
      : "Top-level group for the customer catalog."

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="scrollbar-theme min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <form
          id="category-form"
          onSubmit={form.handleSubmit((values) => onSubmit({ ...values, image }))}
          className="grid w-full min-w-0 gap-4"
          noValidate
        >
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup className="min-w-0">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-name">Name</FieldLabel>
                  <Input {...field} id="category-name" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
                  <Input
                    {...field}
                    id="category-slug"
                    placeholder="Generated from name if empty"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Field>
              <FieldLabel>Image</FieldLabel>
              <CategoryImageField
                image={image}
                onImageChange={setImage}
                onSelect={() => setPickerOpen(true)}
                disabled={submitting}
              />
            </Field>
            {!isSub ? (
              <>
                <Controller
                  name="iconKey"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="category-icon-key">Bar icon</FieldLabel>
                      <div className="w-full min-w-0">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="category-icon-key" className="w-full min-w-0 max-w-full">
                          <SelectValue placeholder="Icon">
                            {CATEGORY_ICON_LABELS[field.value] ?? field.value}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_ICON_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
                              {CATEGORY_ICON_LABELS[key] ?? key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  name="iconTone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="category-icon-tone">Icon color</FieldLabel>
                      <div className="w-full min-w-0">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="category-icon-tone" className="w-full min-w-0 max-w-full">
                          <SelectValue placeholder="Color">
                            {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_ICON_TONES.map((tone) => (
                            <SelectItem key={tone} value={tone}>
                              {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </>
            ) : null}
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="category-active">Active</FieldLabel>
                  <Switch
                    id="category-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        </div>
        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {isEdit ? "Save" : isSub ? "Add subcategory" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ProductMediaPickerDialog
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      attached={image ? [image] : []}
      max={1}
      kinds={["image"]}
      onAdd={(picked) => {
        const row = picked[0] ? toGalleryItem(picked[0]) : null
        setImage(row)
      }}
      disabled={submitting}
    />
    </>
  )
}
