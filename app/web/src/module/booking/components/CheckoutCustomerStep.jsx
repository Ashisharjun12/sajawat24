import { IndiaPhoneInput } from "@/components/IndiaPhoneInput";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CheckoutCustomerStep({ value, onChange }) {
  function patch(key, next) {
    onChange({ ...value, [key]: next });
  }

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="checkout-name">Full name</FieldLabel>
        <Input
          id="checkout-name"
          autoComplete="name"
          placeholder="Full name"
          value={value.name}
          onChange={(event) => patch("name", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="checkout-phone">Phone</FieldLabel>
        <IndiaPhoneInput
          id="checkout-phone"
          rounded="lg"
          value={value.phone}
          onChange={(next) => patch("phone", next)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
        <Input
          id="checkout-email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={value.email}
          onChange={(event) => patch("email", event.target.value)}
        />
      </Field>
    </FieldGroup>
  );
}
