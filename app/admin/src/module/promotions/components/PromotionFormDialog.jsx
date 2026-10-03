import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { listAdmin as listCities } from "@/api/cities.api"
import { RupeesPolicyInput } from "@/components/RupeesPolicyInput"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { CouponTargetPickerDialog } from "@/module/promotions/components/CouponTargetPickerDialog"
import { buildApiPayload, promotionFormSchema } from "@/module/promotions/schema"

function toDateInput(iso) {
  if (!iso) return ""
  return iso.slice(0, 10)
}

function defaultValues(coupon) {
  const methods = coupon?.allowedPaymentMethods ?? ["online", "cod"]
  const targetLabels =
    coupon?.targets?.length > 0
      ? coupon.targets
      : (coupon?.targetIds ?? []).map((id) => ({ id, name: "Selected item" }))

  return {
    code: coupon?.code ?? "",
    name: coupon?.name ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? "flat",
    valuePaise: coupon?.valuePaise ?? 10000,
    percent: coupon?.percentBps ? coupon.percentBps / 100 : 10,
    maxDiscountPaise: coupon?.maxDiscountPaise ?? null,
    minOrderPaise: coupon?.minOrderPaise ?? 0,
    maxUses: coupon?.maxUses ?? 100,
    maxUsesPerUser: coupon?.maxUsesPerUser ?? 1,
    cityId: coupon?.cityId ?? "all",
    scope: coupon?.scope ?? "entire_cart",
    targetIds: coupon?.targetIds ?? [],
    targetLabels,
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    paymentOnline: methods.includes("online"),
    paymentCod: methods.includes("cod"),
    startsAt: toDateInput(coupon?.startsAt) || new Date().toISOString().slice(0, 10),
    endsAt: toDateInput(coupon?.endsAt) || "2026-12-31",
    isActive: coupon ? coupon.status !== "disabled" : true,
  }
}

export function PromotionFormDialog({ open, onOpenChange, coupon, onSubmit, submitting = false }) {
  const isEdit = Boolean(coupon)
  const form = useForm({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: defaultValues(coupon),
  })
  const watched = useWatch({ control: form.control })
  const type = watched.type
  const scope = watched.scope
  const targetIds = watched.targetIds ?? []
  const targetLabels = watched.targetLabels ?? []

  const [cities, setCities] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    form.reset(defaultValues(coupon))
  }, [open, coupon, form])

  useEffect(() => {
    if (!open) return
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [open])

  function handleSubmit(values) {
    onSubmit(buildApiPayload(values))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-hidden sm:max-w-lg">
          <DialogHeader className="shrink-0">
            <DialogTitle>{isEdit ? "Edit coupon" : "Create coupon"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update coupon rules and eligibility."
                : "Add a checkout coupon code customers can apply at bag checkout."}
            </DialogDescription>
          </DialogHeader>
          <div className="scrollbar-theme min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <form
              id="promotion-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid w-full min-w-0 gap-4"
              noValidate
            >
              <FieldGroup className="min-w-0">
                <Controller
                  name="code"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="promo-code">Code</FieldLabel>
                      <Input
                        {...field}
                        id="promo-code"
                        className="font-mono uppercase"
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="promo-name">Display name</FieldLabel>
                      <Input {...field} id="promo-name" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="promo-description">Description (optional)</FieldLabel>
                      <Textarea
                        {...field}
                        id="promo-description"
                        rows={3}
                        placeholder="e.g. Valid on birthday packages in Mumbai. Cannot be combined with other offers."
                        aria-invalid={fieldState.invalid}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown to customers at checkout. Leave blank to auto-generate from rules below.
                      </p>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Discount type</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat amount</SelectItem>
                          <SelectItem value="percent">Percent</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                {type === "flat" ? (
                  <Controller
                    name="valuePaise"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <RupeesPolicyInput
                          id="promo-value"
                          label="Discount amount"
                          valuePaise={field.value ?? 0}
                          onChangePaise={field.onChange}
                          min={1}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                ) : (
                  <>
                    <Controller
                      name="percent"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="promo-percent">Discount percent</FieldLabel>
                          <Input
                            id="promo-percent"
                            type="number"
                            min={1}
                            max={100}
                            step={1}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                    <Controller
                      name="maxDiscountPaise"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <RupeesPolicyInput
                            id="promo-max-discount"
                            label="Max discount cap"
                            hint="Optional — limits percent savings"
                            valuePaise={field.value ?? 0}
                            onChangePaise={(v) => field.onChange(v > 0 ? v : null)}
                          />
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </>
                )}
                <Controller
                  name="minOrderPaise"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <RupeesPolicyInput
                        id="promo-min-order"
                        label="Minimum order"
                        hint="0 means no minimum"
                        valuePaise={field.value ?? 0}
                        onChangePaise={field.onChange}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="maxUses"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="promo-max-uses">Max uses</FieldLabel>
                        <Input
                          id="promo-max-uses"
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="maxUsesPerUser"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="promo-max-user">Per user</FieldLabel>
                        <Input
                          id="promo-max-user"
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  name="cityId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>City scope</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All cities</SelectItem>
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
                  name="scope"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Applies to</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue("targetIds", [])
                          form.setValue("targetLabels", [])
                        }}
                      >
                        <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entire_cart">Entire cart</SelectItem>
                          <SelectItem value="products">Specific products</SelectItem>
                          <SelectItem value="categories">Specific categories</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                {scope !== "entire_cart" ? (
                  <Controller
                    name="targetIds"
                    control={form.control}
                    render={({ fieldState }) => (
                      <Field data-invalid={fieldState?.invalid}>
                        <FieldLabel>
                          {scope === "products" ? "Products" : "Categories"}
                        </FieldLabel>
                        <div className="space-y-2">
                          {targetLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {targetLabels.map((chip) => (
                                <span
                                  key={chip.id}
                                  className="inline-flex max-w-full items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
                                >
                                  <span className="truncate">{chip.name}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No items selected yet.</p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPickerOpen(true)}
                          >
                            {targetIds.length > 0
                              ? `Edit ${scope === "products" ? "products" : "categories"} (${targetIds.length})`
                              : scope === "products"
                                ? "Browse products…"
                                : "Choose categories…"}
                          </Button>
                        </div>
                        {fieldState?.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                ) : null}
                <Controller
                  name="firstOrderOnly"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="promo-first-order">First order only</FieldLabel>
                      <Switch
                        id="promo-first-order"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel>Payment methods</FieldLabel>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <Controller
                      name="paymentOnline"
                      control={form.control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          Online
                        </label>
                      )}
                    />
                    <Controller
                      name="paymentCod"
                      control={form.control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          Cash on delivery
                        </label>
                      )}
                    />
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="startsAt"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="promo-starts">Starts</FieldLabel>
                        <Input
                          id="promo-starts"
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Controller
                    name="endsAt"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="promo-ends">Ends</FieldLabel>
                        <Input
                          id="promo-ends"
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="promo-active">Active</FieldLabel>
                      <Switch
                        id="promo-active"
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
            <Button type="submit" form="promotion-form" disabled={submitting}>
              {isEdit ? "Save coupon" : "Create coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CouponTargetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={scope === "categories" ? "categories" : "products"}
        value={targetIds}
        labels={targetLabels}
        onConfirm={({ ids, labels }) => {
          form.setValue("targetIds", ids, { shouldValidate: true })
          form.setValue("targetLabels", labels)
        }}
      />
    </>
  )
}
