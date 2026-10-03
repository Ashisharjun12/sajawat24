export type LatLng = {
    latitude: number;
    longitude: number;
};

export type RouteResult = {
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
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

export type ReverseGeocodeResult = {
    placeName: string | null;
    formattedAddress: string;
    pincode: string | null;
    cityName: string | null;
};

export type MapsAutocompleteOptions = {
    sessionToken?: string;
    location?: LatLng;
};

export interface MapsProvider {
    computeRoute(origin: LatLng, destination: LatLng): Promise<RouteResult>;
    autocomplete(input: string, options?: MapsAutocompleteOptions): Promise<PlacePrediction[]>;
    getPlaceDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails>;
    reverseGeocode(location: LatLng): Promise<ReverseGeocodeResult>;
}
