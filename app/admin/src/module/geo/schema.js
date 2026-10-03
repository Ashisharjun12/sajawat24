import { z } from "zod";
import indiaRegions from "@/data/states.json";

export const INDIA_STATES = indiaRegions.states;
export const INDIA_UNION_TERRITORIES = indiaRegions.unionTerritories;
export const INDIA_REGIONS = [...INDIA_STATES, ...INDIA_UNION_TERRITORIES];

export const citySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  state: z
    .string()
    .min(1, "Select a state")
    .refine((value) => INDIA_REGIONS.includes(value), "Select a state"),
  slug: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 2, "Slug must be at least 2 characters"),
  isActive: z.boolean(),
});

export const pincodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN starting with 1-9"),
  cityId: z.string().uuid("Select a city"),
  locality: z.string().trim(),
  isServiceable: z.boolean(),
});
