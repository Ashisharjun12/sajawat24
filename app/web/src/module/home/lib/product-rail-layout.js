/** Show prev/next only when the rail has more items than fit in one glance. */
export const PRODUCT_RAIL_MIN_ITEMS_FOR_CONTROLS = 5;

/** PDP “You may also like” — show ‹ › when at least this many items. */
export const PRODUCT_RAIL_PDP_MIN_CONTROLS = 3;

/** Carousel item width: ~2.5 cards on sm, ~4.5 cards on md+ (peek invites scroll). */
export const PRODUCT_RAIL_ITEM_CLASS =
  "basis-[44%] sm:basis-[calc(100%/2.5)] md:basis-[calc(100%/4.5)]";

/** PDP similar rail — smaller cards (~2.4 mobile, ~4.5 desktop). */
export const PRODUCT_RAIL_PDP_SIMILAR_ITEM_CLASS =
  "basis-[calc(100%/2.4)] sm:basis-[40%] md:basis-[calc(100%/4.5)]";

/** PDP horizontal rail slot: 2 full cards per viewport on mobile. gap-2.5 = 0.625rem */
export const PRODUCT_RAIL_PDP_MOBILE_CARD_SLOT =
  "max-md:w-[calc((100%-0.625rem)/2)] md:w-[calc((100%-2.5rem)/4.5)]";
