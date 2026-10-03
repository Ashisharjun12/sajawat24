import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { pincodeSchema } from "@/module/geo/schema"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PincodeFormDialog({
  open,
  onOpenChange,
  pincode,
  cities,
  onSubmit,
  submitting,
  error,
}) {
  const isEdit = Boolean(pincode)
  const form = useForm({
    resolver: zodResolver(pincodeSchema),
    defaultValues: {
      code: "",
      cityId: "",
      locality: "",
      isServiceable: true,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      code: pincode?.code ?? "",
      cityId: pincode?.cityId ?? "",
      locality: pincode?.locality ?? "",
      isServiceable: pincode?.isServiceable ?? true,
    })
  }, [open, pincode, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit pincode" : "Add pincode"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Turn a PIN off with the serviceable switch. Code cannot be changed."
              : "Add one PIN we actually serve."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="pincode-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4"
          noValidate
        >
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="pin-code">Pincode</FieldLabel>
                  <Input
                    {...field}
                    id="pin-code"
                    inputMode="numeric"
                    disabled={isEdit}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="cityId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>City</FieldLabel>
                  <Select value={field.value || null} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a city">
                        {cities.find((c) => c.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="locality"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="pin-locality">Locality</FieldLabel>
                  <Input {...field} id="pin-locality" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="isServiceable"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="pin-serviceable">Serviceable</FieldLabel>
                  <Switch
                    id="pin-serviceable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="pincode-form" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {isEdit ? "Save" : "Add pincode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
