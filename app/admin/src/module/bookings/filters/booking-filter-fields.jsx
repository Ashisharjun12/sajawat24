import { CircleDotIcon, CreditCardIcon, MapPinIcon, ZapIcon } from "lucide-react"
import { BOOKING_STATUS_OPTIONS } from "@/module/bookings/lib/booking-status"

const IS = [{ value: "is", label: "is", arity: "one" }];

function toOptions(rows, valueKey = "id", labelKey = "name") {
  return rows.map((row) => ({
    value: row[valueKey],
    label: row[labelKey],
  }));
}

export function buildBookingFilterFields({ cities = [] } = {}) {
  return [
    {
      id: "status",
      label: "Status",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: BOOKING_STATUS_OPTIONS,
      icon: <CircleDotIcon />,
    },
    {
      id: "cityId",
      label: "City",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      options: toOptions(cities),
      icon: <MapPinIcon />,
    },
    {
      id: "paymentMethod",
      label: "Payment",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "COD", label: "Cash on delivery" },
        { value: "ONLINE", label: "Online" },
        { value: "PREPAID", label: "Already paid" },
      ],
      icon: <CreditCardIcon />,
    },
    {
      id: "fulfillmentType",
      label: "Fulfillment",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "instant", label: "Instant" },
        { value: "scheduled", label: "Scheduled" },
      ],
      icon: <ZapIcon />,
    },
    {
      id: "dispatchStatus",
      label: "Dispatch",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "exhausted", label: "Dispatch exhausted" },
        { value: "offering", label: "Offer pending" },
        { value: "searching", label: "Searching" },
        { value: "accepted", label: "Dispatch accepted" },
        { value: "idle", label: "Dispatch idle" },
      ],
      icon: <ZapIcon />,
    },
  ];
}
