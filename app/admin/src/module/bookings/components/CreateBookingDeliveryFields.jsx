import { useEffect, useState } from "react"
import { Controller } from "react-hook-form"
import { isPincodeDeliverable, resolvePincode } from "@/api/geo.api"
import { getApiError } from "@/api/api"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

function lookupErrorMessage(data) {
  if (data?.deliverable) return ""
  switch (data?.reason) {
    case "pincode_city_mismatch":
      return "This PIN is not in the package city."
    case "pincode_not_serviceable":
      return "This PIN is blocked for delivery."
    case "city_inactive":
      return "This city is not active."
    case "unknown_pin":
      return "Select the package city first, or add this PIN under Locations."
    default:
      return "This pincode is not serviceable"
  }
}

export function CreateBookingDeliveryFields({ form, packageCityName, onCityResolved }) {
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")
  const [pincodeCityLabel, setPincodeCityLabel] = useState("")
  const [mismatchError, setMismatchError] = useState("")

  const pincode = form.watch("delivery.pincode")
  const packageCityId = form.watch("delivery.cityId")

  useEffect(() => {
    const code = String(pincode ?? "").replace(/\D/g, "")
    if (code.length !== 6) {
      setPincodeCityLabel("")
      setResolveError("")
      setMismatchError("")
      onCityResolved?.(null)
      return
    }

    let cancelled = false
    setResolving(true)
    setResolveError("")
    setMismatchError("")

    const lookupOptions = packageCityId ? { cityId: packageCityId } : undefined

    resolvePincode(code, lookupOptions)
      .then((data) => {
        if (cancelled) return

        if (packageCityId) {
          if (!isPincodeDeliverable(data)) {
            setPincodeCityLabel("")
            onCityResolved?.(null)
            setResolveError(lookupErrorMessage(data))
            return
          }
          const city = data.city
          const pincodeLabel = `${city.name}, ${city.state}`
          setPincodeCityLabel(pincodeLabel)
          onCityResolved?.(city)
          return
        }

        if (!isPincodeDeliverable(data)) {
          setPincodeCityLabel("")
          onCityResolved?.(null)
          setResolveError(lookupErrorMessage(data))
          return
        }

        const pincodeCity = data.city
        const pincodeLabel = `${pincodeCity.name}, ${pincodeCity.state}`
        setPincodeCityLabel(pincodeLabel)
        onCityResolved?.(pincodeCity)
        form.setValue("delivery.cityId", pincodeCity.id, { shouldValidate: true })
      })
      .catch((err) => {
        if (cancelled) return
        setPincodeCityLabel("")
        onCityResolved?.(null)
        setResolveError(getApiError(err))
      })
      .finally(() => {
        if (!cancelled) setResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [pincode, packageCityId, packageCityName, form, onCityResolved])

  const cityDescription = mismatchError
    ? null
    : pincodeCityLabel
      ? pincodeCityLabel
      : packageCityId && packageCityName
        ? `Package city: ${packageCityName}`
        : null

  return (
    <FieldGroup>
      <Controller
        name="delivery.pincode"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Pincode</FieldLabel>
            <Input {...field} inputMode="numeric" placeholder="6-digit pincode" maxLength={6} />
            {resolving ? (
              <FieldDescription className="flex items-center gap-2">
                <Spinner className="size-3" />
                Checking service area…
              </FieldDescription>
            ) : cityDescription ? (
              <FieldDescription>{cityDescription}</FieldDescription>
            ) : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      {resolveError ? (
        <Alert variant="destructive">
          <AlertDescription>{resolveError}</AlertDescription>
        </Alert>
      ) : null}
      {mismatchError ? (
        <Alert variant="destructive">
          <AlertDescription>{mismatchError}</AlertDescription>
        </Alert>
      ) : null}
      <Controller
        name="delivery.address"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Address</FieldLabel>
            <Input {...field} placeholder="House, street, area" />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="delivery.landmark"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Landmark (optional)</FieldLabel>
            <Input {...field} placeholder="Near metro, society gate, etc." />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  )
}
