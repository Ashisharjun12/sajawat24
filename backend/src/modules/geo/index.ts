import { Router } from "express";
import { CityController } from "@/modules/geo/cities/city.controller.js";
import { CityRepository } from "@/modules/geo/cities/city.repository.js";
import { createCityAdminRouter, createCityPublicRouter } from "@/modules/geo/cities/city.route.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { CityService } from "@/modules/geo/cities/city.service.js";
import { PincodeController } from "@/modules/geo/pincodes/pincode.controller.js";
import { PincodeRepository } from "@/modules/geo/pincodes/pincode.repository.js";
import { createPincodeAdminRouter, createPincodePublicRouter } from "@/modules/geo/pincodes/pincode.route.js";
import { pincodes } from "@/modules/geo/pincodes/pincode.schema.js";
import { PincodeService } from "@/modules/geo/pincodes/pincode.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { publicCity, type PublicCity } from "@/modules/geo/cities/city.public.js";
import type {
    DeliveryLocationInput,
    PincodeLookupResult,
    ResolvedPincode,
} from "@/modules/geo/pincodes/pincode.service.js";

const cityRepository = new CityRepository();
const pincodeRepository = new PincodeRepository();

const cityService = new CityService(cityRepository);
const pincodeService = new PincodeService(pincodeRepository, cityRepository);

const cityController = new CityController(cityService);
const pincodeController = new PincodeController(pincodeService);

export const geoRouter = Router();
geoRouter.use("/cities", createCityPublicRouter(cityController));
geoRouter.use(createPincodePublicRouter(pincodeController));

export const geoCityAdminRouter = createCityAdminRouter(cityController);
export const geoPincodeAdminRouter = createPincodeAdminRouter(pincodeController);

export function lookupPincode(pincode: string, cityId?: string): Promise<PincodeLookupResult> {
    return pincodeService.lookup(pincode, cityId);
}

export function assertDeliveryLocation(input: DeliveryLocationInput): Promise<ResolvedPincode> {
    return pincodeService.assertDeliveryLocation(input);
}

export function assertServiceable(pincode: string): Promise<ResolvedPincode> {
    return pincodeService.assertServiceable(pincode);
}

export function getCityByPincode(pincode: string): Promise<PublicCity> {
    return pincodeService.getCityByPincode(pincode);
}

export async function getActiveCityById(id: string): Promise<PublicCity> {
    const city = await cityRepository.findById(id);
    if (!city || !city.isActive) {
        throw ApiError.badRequest("city not found");
    }
    return publicCity(city);
}

export { cities, pincodes };
