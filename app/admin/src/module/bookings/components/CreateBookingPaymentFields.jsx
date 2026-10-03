import { Controller } from "react-hook-form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function CreateBookingPaymentFields({ form }) {
  return (
    <FieldGroup>
      <Controller
        name="paymentMethod"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Payment</FieldLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
              <div className="flex items-start gap-2">
                <RadioGroupItem value="prepaid" id="payment-prepaid" />
                <div className="grid gap-0.5">
                  <Label htmlFor="payment-prepaid" className="font-medium">
                    Already paid
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Customer paid you offline (UPI, cash, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="cod" id="payment-cod" />
                <div className="grid gap-0.5">
                  <Label htmlFor="payment-cod" className="font-medium">
                    Cash on delivery
                  </Label>
                  <p className="text-sm text-muted-foreground">Customer pays the decorator on site</p>
                </div>
              </div>
            </RadioGroup>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="adminNotes"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Internal notes (optional)</FieldLabel>
            <Input {...field} placeholder="e.g. Paid ₹5000 on GPay" />
            <FieldDescription>Visible to admins only</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  )
}
