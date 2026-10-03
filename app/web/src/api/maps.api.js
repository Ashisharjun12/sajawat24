import { api, unwrap } from "@/api/api";

export function fetchMapsSdkConfig() {
  return api.get("/maps/sdk-config").then(unwrap);
}

export function autocompletePlaces(input, { sessionToken, location } = {}) {
  const params = { input };
  if (sessionToken) params.sessionToken = sessionToken;
  if (location?.latitude != null && location?.longitude != null) {
    params.location = `${location.latitude},${location.longitude}`;
  }
  return api
    .get("/maps/places/autocomplete", { params })
    .then((response) => {
      const data = unwrap(response);
      return data.suggestions ?? [];
    });
}

export function getPlaceDetails(placeId, sessionToken) {
  const body = sessionToken ? { sessionToken } : {};
  return api.post(`/maps/places/${encodeURIComponent(placeId)}`, body).then(unwrap);
}

export function reverseGeocode(latitude, longitude) {
  return api
    .get("/maps/reverse", { params: { lat: latitude, lng: longitude } })
    .then(unwrap);
}
