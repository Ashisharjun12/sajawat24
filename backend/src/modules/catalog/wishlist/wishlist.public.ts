import type { PublicInstantInfo } from "@/modules/catalog/products/product-instant.public.js";

export type WishlistUnavailableReason = "inactive" | "not_in_city" | "no_price";

export type WishlistProductCard = {
    id: string;
    name: string;
    title: string;
    slug: string;
    pricePaise: number;
    compareAtPaise: number | null;
    imageUrl: string | null;
    ratingAvg: string | null;
    reviewCount: number;
    instant: PublicInstantInfo | null;
};

export type WishlistItemPublic = {
    productId: string;
    addedAt: string;
    available: boolean;
    unavailableReason?: WishlistUnavailableReason;
    product?: WishlistProductCard;
};

export type WishlistListResponse = {
    items: WishlistItemPublic[];
    meta: { total: number; capped?: boolean };
};
