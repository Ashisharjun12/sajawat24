import { CalendarIcon, MapPinIcon, ShoppingBagIcon, WifiIcon } from "lucide-react"

const IS = [{ value: "is", label: "is", arity: "one" }]

function toCityOptions(cities) {
  return cities.map((city) => ({
    value: city.id,
    label: city.name,
  }))
}

export function buildCustomerFilterFields({ cities = [] } = {}) {
  return [
    {
      id: "cityId",
      label: "City",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      options: toCityOptions(cities),
      icon: <MapPinIcon />,
    },
    {
      id: "hasBookings",
      label: "Has bookings",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
      icon: <ShoppingBagIcon />,
    },
    {
      id: "joinedFrom",
      label: "Joined from",
      type: "text",
      defaultOperator: "is",
      operators: IS,
      placeholder: "YYYY-MM-DD",
      icon: <CalendarIcon />,
    },
    {
      id: "joinedTo",
      label: "Joined to",
      type: "text",
      defaultOperator: "is",
      operators: IS,
      placeholder: "YYYY-MM-DD",
      icon: <CalendarIcon />,
    },
  ]
}

export function buildVendorFilterFields({ cities = [] } = {}) {
  return [
    {
      id: "cityId",
      label: "City",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      options: toCityOptions(cities),
      icon: <MapPinIcon />,
    },
    {
      id: "isOnDuty",
      label: "On duty",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "true", label: "Online" },
        { value: "false", label: "Offline" },
      ],
      icon: <WifiIcon />,
    },
    {
      id: "joinedFrom",
      label: "Joined from",
      type: "text",
      defaultOperator: "is",
      operators: IS,
      placeholder: "YYYY-MM-DD",
      icon: <CalendarIcon />,
    },
    {
      id: "joinedTo",
      label: "Joined to",
      type: "text",
      defaultOperator: "is",
      operators: IS,
      placeholder: "YYYY-MM-DD",
      icon: <CalendarIcon />,
    },
  ]
}
