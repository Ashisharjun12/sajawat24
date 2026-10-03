import type {
    LatLng,
    MapsProvider,
    PlaceDetails,
    PlacePrediction,
    ReverseGeocodeResult,
    RouteResult,
} from "@/modules/maps/maps.types.js";
import { OlaMapsProvider } from "@/modules/maps/providers/ola/ola-maps.provider.js";
import type { MapsAutocompleteOptions } from "@/modules/maps/maps.types.js";
import { buildOlaWebSdkConfig, type OlaWebSdkConfig } from "@/modules/maps/providers/ola/ola-maps.sdk-config.js";

let provider: MapsProvider | null = null;

function resolveProvider(): MapsProvider {
    if (!provider) {
        provider = new OlaMapsProvider();
    }
    return provider;
}

export class MapsService {
    computeRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
        return resolveProvider().computeRoute(origin, destination);
    }

    autocomplete(input: string, options?: MapsAutocompleteOptions): Promise<PlacePrediction[]> {
        return resolveProvider().autocomplete(input, options);
    }

    getPlaceDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails> {
        return resolveProvider().getPlaceDetails(placeId, sessionToken);
    }

    reverseGeocode(location: LatLng): Promise<ReverseGeocodeResult> {
        return resolveProvider().reverseGeocode(location);
    }

    getWebSdkConfig(): Promise<OlaWebSdkConfig> {
        return buildOlaWebSdkConfig();
    }
}

const mapsService = new MapsService();

export function getMapsService(): MapsService {
    return mapsService;
}
