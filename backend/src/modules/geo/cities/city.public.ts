import type { City } from "@/modules/geo/cities/city.schema.js";

export type PublicCity = {
    id: string;
    name: string;
    slug: string;
    state: string;
    imageUrl?: string | null;
};

export function publicCity(city: City, imageUrl?: string | null): PublicCity {
    return {
        id: city.id, 
        name: city.name,
        slug: city.slug,
        state: city.state,
        ...(imageUrl ? { imageUrl } : {}),
    };
}

export function slugify(name: string): string {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug;
}
