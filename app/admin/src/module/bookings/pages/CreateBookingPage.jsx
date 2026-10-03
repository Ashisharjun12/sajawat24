import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"
import { createBooking } from "@/api/bookings.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CreateBookingCustomerFields } from "@/module/bookings/components/CreateBookingCustomerFields"
import { CreateBookingDeliveryFields } from "@/module/bookings/components/CreateBookingDeliveryFields"
import { CreateBookingOrderCard } from "@/module/bookings/components/CreateBookingOrderCard"
import { CreateBookingPaymentFields } from "@/module/bookings/components/CreateBookingPaymentFields"
import { CreateBookingSummary } from "@/module/bookings/components/CreateBookingSummary"
import { useBookingOrderPreview } from "@/module/bookings/hooks/use-booking-order-preview"
import {
  createBookingSchema,
  isCustomBookingReady,
  toCreateBookingPayload,
} from "@/module/bookings/schema/create-booking.schema"

export function CreateBookingPage() {
  const navigate = useNavigate()
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [resolvedCity, setResolvedCity] = useState(null)
  const [packageCity, setPackageCity] = useState(null)
  const [orderSelection, setOrderSelection] = useState(null)
  const [pincodeMismatch, setPincodeMismatch] = useState(false)

  const form = useForm({
    resolver: zodResolver(createBookingSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      orderKind: "catalog",
      customer: { name: "", phone: "", email: "" },
      delivery: { pincode: "", address: "", landmark: "", cityId: "" },
      scheduledAt: "",
      productId: "",
      quantity: 1,
      addonIds: [],
      customName: "",
      customPriceRupees: "",
      customImageUploadId: "",
      customImagePreviewUrl: "",
      paymentMethod: "prepaid",
      adminNotes: "",
    },
  })

  const orderKind = form.watch("orderKind")
  const formValues = form.watch()
  const cityId = form.watch("delivery.cityId")
  const quantity = form.watch("quantity") || 1
  const addonIds = form.watch("addonIds") ?? []
  const cityName = packageCity?.name || resolvedCity?.name || orderSelection?.cityName || ""

  const previewFallback = useMemo(() => {
    if (!orderSelection) return null
    return {
      productName: orderSelection.productName,
      coverUrl: orderSelection.coverUrl,
      pricePaise: orderSelection.pricePaise,
      compareAtPaise: orderSelection.compareAtPaise,
      addons: [],
      totalPaise: orderSelection.pricePaise != null
        ? orderSelection.pricePaise * (orderSelection.quantity ?? 1)
        : null,
    }
  }, [orderSelection])

  const preview = useBookingOrderPreview({
    enabled: orderKind !== "custom",
    productId: orderSelection?.productId ?? "",
    cityId: orderSelection?.cityId ?? cityId,
    addonIds: orderSelection?.addonIds ?? addonIds,
    quantity: orderSelection?.quantity ?? quantity,
    fallback: previewFallback,
  })

  const orderReady =
    orderKind === "custom" ? isCustomBookingReady(formValues) : Boolean(orderSelection)

  useEffect(() => {
    if (!resolvedCity?.id || !cityId) {
      setPincodeMismatch(false)
      return
    }
    setPincodeMismatch(resolvedCity.id !== cityId)
  }, [resolvedCity, cityId])

  async function onSubmit(values) {
    if (
      resolvedCity?.id &&
      values.delivery.cityId &&
      resolvedCity.id !== values.delivery.cityId
    ) {
      setError(
        orderKind === "custom"
          ? `Delivery pincode is in ${resolvedCity.name}, but the setup city is ${packageCity?.name || "another city"}.`
          : `Delivery pincode is in ${resolvedCity.name}, but the package is priced for ${packageCity?.name || "another city"}.`,
      )
      return
    }

    setSubmitting(true)
    setError("")
    try {
      const payload = toCreateBookingPayload(values, idempotencyKey)
      const data = await createBooking(payload)
      toast.success("Booking created")
      navigate(`/bookings/${data.order.id}`)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={() => navigate("/bookings")}
          >
            <ArrowLeftIcon />
            Back to bookings
          </Button>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Add booking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a booking on behalf of a customer. They will receive a confirmation SMS.
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form
        className="grid gap-6 lg:grid-cols-[1fr_280px]"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
              <CardDescription>Details collected from call or chat</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateBookingCustomerFields form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order</CardTitle>
              <CardDescription>Platform catalog package or a custom customer-specific setup</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateBookingOrderCard
                form={form}
                orderSelection={orderSelection}
                preview={preview}
                onOrderSelectionChange={setOrderSelection}
                onPackageCityChange={setPackageCity}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery</CardTitle>
              <CardDescription>Where the setup will happen</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateBookingDeliveryFields
                form={form}
                packageCityName={packageCity?.name}
                onCityResolved={(city) => {
                  setResolvedCity(city)
                  const packageCityId = form.getValues("delivery.cityId")
                  setPincodeMismatch(
                    Boolean(city?.id && packageCityId && city.id !== packageCityId),
                  )
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateBookingPaymentFields form={form} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <CreateBookingSummary
            form={form}
            orderSelection={orderSelection}
            preview={preview}
            cityName={cityName}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !orderReady || pincodeMismatch}
          >
            {submitting ? <Spinner className="size-4" /> : null}
            Create booking
          </Button>
        </div>
      </form>
    </div>
  )
}
