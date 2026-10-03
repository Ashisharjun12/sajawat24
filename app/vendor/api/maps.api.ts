import { api, unwrap } from '@/api/client';

export type MapsSdkConfig = {
  styleUrl: string;
  accessToken: string;
  apiKey: string;
  authMode: 'oauth' | 'api_key';
};

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

export function fetchMapsSdkConfig() {
  return api.get('/maps/sdk-config').then(unwrap<MapsSdkConfig>);
}

export function autocompletePlaces(input: string, sessionToken?: string) {
  return api
    .get('/maps/places/autocomplete', {
      params: { input, sessionToken },
    })
    .then((response) => {
      const data = unwrap<{ suggestions: PlacePrediction[] }>(response);
      return data.suggestions ?? [];
    });
}

export function getPlaceDetails(placeId: string, sessionToken?: string) {
  return api
    .post(`/maps/places/${placeId}`, { sessionToken })
    .then(unwrap<PlaceDetails>);
}
