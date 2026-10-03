import { Controller } from "react-hook-form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CreateBookingCustomerFields({ form }) {
  return (
    <FieldGroup>
      <Controller
        name="customer.name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Customer name</FieldLabel>
            <Input {...field} autoComplete="name" placeholder="Full name" />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="customer.phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Phone</FieldLabel>
            <Input
              {...field}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit mobile"
              maxLength={10}
            />
            <FieldDescription>India mobile without +91</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="customer.email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Email (optional)</FieldLabel>
            <Input {...field} type="email" autoComplete="email" placeholder="customer@email.com" />
            <FieldDescription>Helps if they sign in with Google later</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  )
}
