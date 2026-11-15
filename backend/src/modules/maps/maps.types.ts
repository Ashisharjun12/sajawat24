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

/** Where an Indian pincode is, per the maps provider (Ola: locality / district / state). */
export type PincodePlace = {
    pincode: string;
    /** Town/city, e.g. "Patna", "Navi Mumbai". */
    city: string | null;
    /** District (Ola administrative_area_level_3), e.g. "Patna Rural", "Panvel". */
    district: string | null;
    /** State (administrative_area_level_1), e.g. "Bihar". */
    state: string | null;
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
    /** City/district/state for a 6-digit Indian pincode; null when the provider doesn't know it. */
    geocodePincode(pincode: string): Promise<PincodePlace | null>;
}
