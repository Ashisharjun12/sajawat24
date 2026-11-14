import {
  MAP_DRIVER_MARKER_ICON_PX,
  MAP_DRIVER_MARKER_URL,
  MAP_FIXED_LOCATION_HEIGHT_PX,
  MAP_FIXED_LOCATION_URL,
  MAP_FIXED_LOCATION_WIDTH_PX,
} from "@/module/geo/lib/map-assets";

/** Bike rider image used for the decorator on trip maps (same as the user app). */
export function TripWorkerMarkerIcon({
  className,
  size = MAP_DRIVER_MARKER_ICON_PX,
  alt = "Partner on the way",
}) {
  return (
    <img
      src={MAP_DRIVER_MARKER_URL}
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  );
}

/** Location pin used for the customer venue on trip maps (same as the user app). */
export function TripCustomerMarkerIcon({
  className,
  size = MAP_FIXED_LOCATION_HEIGHT_PX,
  alt = "Customer venue",
}) {
  return (
    <img
      src={MAP_FIXED_LOCATION_URL}
      width={Math.round((size * MAP_FIXED_LOCATION_WIDTH_PX) / MAP_FIXED_LOCATION_HEIGHT_PX)}
      height={size}
      alt={alt}
      className={className}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  );
}
