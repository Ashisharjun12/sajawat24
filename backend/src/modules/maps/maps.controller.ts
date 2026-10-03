import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { getMapsService } from "@/modules/maps/maps.service.js";

export class MapsController {
    autocomplete = asyncHandler(async (req, res) => {
        const input = String(req.query.input ?? "");
        const sessionToken =
            typeof req.query.sessionToken === "string" ? req.query.sessionToken : undefined;
        const locationRaw =
            typeof req.query.location === "string" ? req.query.location.trim() : undefined;
        let location: { latitude: number; longitude: number } | undefined;
        if (locationRaw) {
            const [latStr, lngStr] = locationRaw.split(",");
            const latitude = Number.parseFloat(latStr);
            const longitude = Number.parseFloat(lngStr);
            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                location = { latitude, longitude };
            }
        }
        const data = await getMapsService().autocomplete(input, { sessionToken, location });
        res.status(200).json(new ApiResponse(200, { suggestions: data }, "ok"));
    });

    sdkConfig = asyncHandler(async (_req, res) => {
        const data = await getMapsService().getWebSdkConfig();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    reverseGeocode = asyncHandler(async (req, res) => {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const data = await getMapsService().reverseGeocode({ latitude: lat, longitude: lng });
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    placeDetails = asyncHandler(async (req, res) => {
        const placeId = Array.isArray(req.params.placeId)
            ? req.params.placeId[0]
            : req.params.placeId;
        const sessionToken =
            req.body && typeof req.body.sessionToken === "string"
                ? req.body.sessionToken
                : undefined;
        const data = await getMapsService().getPlaceDetails(String(placeId), sessionToken);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}
