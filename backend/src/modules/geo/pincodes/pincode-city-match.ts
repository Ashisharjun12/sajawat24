import type { City } from "@/modules/geo/cities/city.schema.js";
import type { PincodePlace } from "@/modules/maps/maps.types.js";

/** Old/alternate names → one key, so "Banaras" in admin matches Ola's "Varanasi". */
const CITY_ALIASES: string[][] = [
    ["bengaluru", "bangalore"],
    ["mumbai", "bombay"],
    ["kolkata", "calcutta"],
    ["chennai", "madras"],
    ["gurugram", "gurgaon"],
    ["varanasi", "banaras", "benares", "kashi"],
    ["prayagraj", "allahabad"],
    ["delhi", "newdelhi"],
    ["pune", "poona"],
    ["mysuru", "mysore"],
    ["vadodara", "baroda"],
    ["kochi", "cochin"],
    ["thiruvananthapuram", "trivandrum"],
    ["puducherry", "pondicherry"],
    ["kanpur", "cawnpore"],
];

const STATE_ALIASES: string[][] = [
    ["odisha", "orissa"],
    ["delhi", "nctofdelhi", "newdelhi"],
    ["puducherry", "pondicherry"],
    ["uttarakhand", "uttaranchal"],
];

function norm(value: string | null | undefined): string {
    return (value ?? "")
        .toLowerCase()
        .replace(/\b(city|district|rural|urban|division)\b/g, "")
        .replace(/[^a-z]/g, "");
}

function keyFor(value: string | null | undefined, aliases: string[][]): string {
    const n = norm(value);
    if (!n) return "";
    const group = aliases.find((names) => names.includes(n));
    return group ? group[0] : n;
}

function sameState(adminState: string, olaState: string | null): boolean {
    const a = keyFor(adminState, STATE_ALIASES);
    const b = keyFor(olaState, STATE_ALIASES);
    // Missing on either side → don't block on state.
    if (!a || !b) return true;
    return a === b || a.includes(b) || b.includes(a);
}

/**
 * Admin city that this pincode belongs to: city name (or alias) equals Ola's locality or
 * district, and the state matches. Locality wins over district when both could match.
 */
export function matchPincodeCity(place: PincodePlace, cities: City[]): City | null {
    const locality = keyFor(place.city, CITY_ALIASES);
    const district = keyFor(place.district, CITY_ALIASES);
    const candidates = cities.filter((c) => sameState(c.state, place.state));

    const byName = (target: string) =>
        target ? candidates.find((c) => keyFor(c.name, CITY_ALIASES) === target) : undefined;

    return byName(locality) ?? byName(district) ?? null;
}
