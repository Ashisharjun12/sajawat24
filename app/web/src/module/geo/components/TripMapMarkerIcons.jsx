import { tripMarkerDataUrl } from "@/module/geo/lib/trip-map-markers";

export function TripWorkerMarkerIcon({ className, size = 44, alt = "Partner on the way" }) {
  return (
    <img
      src={tripMarkerDataUrl("worker")}
      width={size}
      height={size}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}

export function TripCustomerMarkerIcon({ className, size = 44, alt = "Customer venue" }) {
  return (
    <img
      src={tripMarkerDataUrl("customer")}
      width={size}
      height={size}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}
