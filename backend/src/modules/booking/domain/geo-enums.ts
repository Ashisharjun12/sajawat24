import { pgEnum } from "drizzle-orm/pg-core";

export const fulfillmentTypeEnum = pgEnum("fulfillment_type", ["scheduled", "instant"]);

export const dispatchStatusEnum = pgEnum("dispatch_status", [
    "idle",
    "searching",
    "offering",
    "accepted",
    "exhausted",
    "cancelled",
]);

export const dispatchOfferStatusEnum = pgEnum("dispatch_offer_status", [
    "offered",
    "accepted",
    "declined",
    "expired",
    "revoked",
]);

export const geoPointSourceEnum = pgEnum("geo_point_source", [
    "geocode_google",
    "geocode_ola",
    "place_pin",
    "geocode_manual",
    "pincode_centroid",
    "device",
]);

export type FulfillmentType = (typeof fulfillmentTypeEnum.enumValues)[number];
export type DispatchStatus = (typeof dispatchStatusEnum.enumValues)[number];
export type DispatchOfferStatus = (typeof dispatchOfferStatusEnum.enumValues)[number];
export type GeoPointSource = (typeof geoPointSourceEnum.enumValues)[number];
