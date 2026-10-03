import { CircleDotIcon, LayersIcon, MapPinIcon, TagIcon, TypeIcon } from "lucide-react"

const CONTAINS = [{ value: "contains", label: "contains", arity: "one" }]
const IS = [{ value: "is", label: "is", arity: "one" }]

function toOptions(rows, valueKey = "id", labelKey = "label") {
  return rows.map((row) => ({
    value: row[valueKey],
    label: row[labelKey],
  }))
}

export function buildProductFilterFields({ leaves = [], cities = [] } = {}) {
  return [
    {
      id: "q",
      label: "Name",
      type: "text",
      keywords: ["search", "slug", "title"],
      placeholder: "Theme cradle",
      defaultOperator: "contains",
      operators: CONTAINS,
      icon: <TypeIcon />,
    },
    {
      id: "isActive",
      label: "Published",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "true", label: "Published" },
        { value: "false", label: "Draft" },
      ],
      icon: <CircleDotIcon />,
    },
    {
      id: "categoryId",
      label: "Category",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      options: toOptions(leaves, "id", "label"),
      icon: <LayersIcon />,
    },
    {
      id: "cityId",
      label: "City",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      keywords: ["priced", "serviceable"],
      options: toOptions(cities, "id", "name"),
      icon: <MapPinIcon />,
    },
    {
      id: "price",
      label: "Price",
      type: "select",
      defaultOperator: "is",
      operators: IS,
      searchable: false,
      options: [
        { value: "none", label: "No price" },
        { value: "set", label: "Has price" },
        { value: "sale", label: "On sale" },
      ],
      icon: <TagIcon />,
    },
  ]
}
