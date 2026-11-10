import { isValidIndianMobileDigits, toLocalPhone } from "@/lib/indian-phone";

/**
 * Form model for the add/edit address flow.
 * - `address` is the STREET line from the map. The full line saved to the server is composed on
 *   save as "house, building, street" (see `composeAddressLine`).
 * - `areaTitle` is the bold place name from the map (display only, never saved).
 * - `isLegacy`: saved before house/floor existed. Its whole line is in `address`, so house/floor
 *   stays optional when editing it.
 */
export const emptyAddressForm = {
  label: "",
  address: "",
  areaTitle: "",
  houseFloor: "",
  buildingBlock: "",
  landmark: "",
  receiverName: "",
  receiverPhone: "",
  pincode: "",
  cityName: "",
  cityId: null,
  isDefault: false,
  latitude: null,
  longitude: null,
  isLegacy: false,
};

/** Saved line is "<house>, <building>, <street>"; split it back for editing. */
function streetLineOf(row) {
  const parts = [row.houseFloor?.trim(), row.buildingBlock?.trim()].filter(Boolean);
  if (parts.length === 0) return row.address ?? "";
  const prefix = `${parts.join(", ")}, `;
  return (row.address ?? "").startsWith(prefix) ? row.address.slice(prefix.length) : row.address;
}

export function addressFormFromRow(row) {
  const hasParts = Boolean(row.houseFloor?.trim() || row.buildingBlock?.trim());
  return {
    ...emptyAddressForm,
    label: row.label ?? "",
    address: streetLineOf(row),
    houseFloor: row.houseFloor ?? "",
    buildingBlock: row.buildingBlock ?? "",
    landmark: row.landmark ?? "",
    receiverName: row.receiverName ?? "",
    receiverPhone: toLocalPhone(row.receiverPhone ?? ""),
    pincode: row.pincode ?? "",
    cityName: row.cityName ?? "",
    cityId: row.cityId ?? null,
    isDefault: Boolean(row.isDefault),
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    isLegacy: !hasParts,
  };
}

/** The single address line sent to the server (what orders and vendors read). */
export function composeAddressLine(form) {
  return [form.houseFloor?.trim(), form.buildingBlock?.trim(), form.address?.trim()]
    .filter(Boolean)
    .join(", ");
}

/**
 * Request body for create / update, or null when something required is missing.
 * For updates, emptied optional fields are sent as null so they really clear (leaving them out
 * would keep the stored value).
 */
export function buildAddressPayload(form, { forUpdate = false } = {}) {
  const pin = (form.pincode ?? "").replace(/\D/g, "").slice(0, 6);
  const line = composeAddressLine(form);
  if (
    !form.cityId ||
    pin.length !== 6 ||
    line.length < 6 ||
    line.length > 500 ||
    form.latitude == null ||
    form.longitude == null
  ) {
    return null;
  }
  const clear = forUpdate ? null : undefined;
  const receiverPhone = toLocalPhone(form.receiverPhone);
  const receiverName = form.receiverName.trim();
  return {
    label: form.label.trim() || "Address",
    address: line,
    landmark: form.landmark.trim() || clear,
    houseFloor: form.houseFloor.trim() || clear,
    buildingBlock: form.buildingBlock.trim() || clear,
    receiverName: receiverName.length >= 2 ? receiverName : clear,
    receiverPhone: isValidIndianMobileDigits(receiverPhone) ? receiverPhone : clear,
    pincode: pin,
    cityId: form.cityId,
    cityName: form.cityName || undefined,
    setDefault: form.isDefault,
    latitude: form.latitude,
    longitude: form.longitude,
    geoSource: "geocode_manual",
  };
}
