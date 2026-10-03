import { reverseGeocode as reverseGeocodeApi } from "@/api/maps.api";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

function extractIndiaPincode(postcode) {
  const digits = String(postcode ?? "").replace(/\D/g, "");
  const match = digits.match(/[1-9]\d{5}/);
  return match?.[0] ?? null;
}

function buildAddressLine(data) {
  const a = data?.address;
  if (!a) {
    const display = data?.display_name;
    return typeof display === "string" ? display.split(",").slice(0, 3).join(", ").trim() : "";
  }
  const parts = [
    a.house_number,
    a.building,
    a.road,
    a.suburb,
    a.neighbourhood,
    a.village,
    a.quarter,
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  const display = data?.display_name;
  return typeof display === "string" ? display.split(",").slice(0, 3).join(", ").trim() : "";
}

async function fetchNominatimReverse(latitude, longitude) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Decoryy/1.0 (https://decoryy.com)",
    },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  return response.json();
}

export function deliveryLineFromReverse(result) {
  const name = result?.placeName?.trim();
  const formatted = (result?.formattedAddress ?? result?.address ?? "").trim();
  if (name && formatted) {
    if (formatted.toLowerCase().startsWith(name.toLowerCase())) return formatted;
    return `${name}, ${formatted}`;
  }
  return formatted || name || "";
}

export async function reverseGeocodePincode(latitude, longitude) {
  const data = await fetchNominatimReverse(latitude, longitude);
  const pincode = extractIndiaPincode(data?.address?.postcode);

  if (!pincode) {
    throw new Error("Could not detect pincode from location");
  }

  return pincode;
}

/** Pin drag preview — prefers Ola reverse geocode (POI names like gyms), Nominatim fallback. */
export async function reverseGeocodeLocation(latitude, longitude) {
  try {
    const ola = await reverseGeocodeApi(latitude, longitude);
    const address = deliveryLineFromReverse(ola);
    return {
      placeName: ola.placeName ?? null,
      address,
      formattedAddress: ola.formattedAddress ?? address,
      pincode: ola.pincode,
      cityName: ola.cityName ?? "",
    };
  } catch {
    const data = await fetchNominatimReverse(latitude, longitude);
    const a = data?.address;
    const pincode = extractIndiaPincode(a?.postcode);
    const cityName =
      a?.city || a?.town || a?.village || a?.state_district || a?.county || "";
    const address = buildAddressLine(data);
    return {
      placeName: null,
      address,
      formattedAddress: address,
      pincode,
      cityName: typeof cityName === "string" ? cityName : "",
    };
  }
}
