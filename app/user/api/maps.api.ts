import { api, unwrap } from '@/api/client';

export type MapsSdkConfig = {
  styleUrl: string;
  accessToken: string;
  apiKey: string;
  authMode: 'oauth' | 'api_key';
};

export function fetchMapsSdkConfig() {
  return api.get('/maps/sdk-config').then(unwrap<MapsSdkConfig>);
}

export type PlacePrediction = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  pincode: string | null;
};

export function autocompletePlaces(
  input: string,
  options: {
    sessionToken?: string;
    location?: { latitude: number; longitude: number };
  } = {},
) {
  const params: Record<string, string> = { input };
  if (options.sessionToken) params.sessionToken = options.sessionToken;
  if (options.location?.latitude != null && options.location?.longitude != null) {
    params.location = `${options.location.latitude},${options.location.longitude}`;
  }
  return api.get('/maps/places/autocomplete', { params }).then(unwrap).then((data) => {
    return (data as { suggestions?: PlacePrediction[] }).suggestions ?? [];
  });
}

export function getPlaceDetails(placeId: string, sessionToken?: string) {
  const body = sessionToken ? { sessionToken } : {};
  return api
    .post(`/maps/places/${encodeURIComponent(placeId)}`, body)
    .then(unwrap) as Promise<PlaceDetails>;
}

export function reverseGeocode(latitude: number, longitude: number) {
  return api
    .get('/maps/reverse', { params: { lat: latitude, lng: longitude } })
    .then(unwrap);
}
