function hasCoords(point) {
  return point?.latitude != null && point?.longitude != null;
}

export function buildGoogleMapsTripUrl(tracking) {
  const vendor = tracking?.vendor;
  const dest = tracking?.destination;

  if (hasCoords(vendor) && hasCoords(dest)) {
    const origin = `${vendor.latitude},${vendor.longitude}`;
    const destination = `${dest.latitude},${dest.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }

  if (hasCoords(dest)) {
    const q = `${dest.latitude},${dest.longitude}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  return null;
}

export function openGoogleMapsTrip(tracking) {
  const url = buildGoogleMapsTripUrl(tracking);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
