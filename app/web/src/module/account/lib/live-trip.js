/** Live map only while the decorator is driving; not before dispatch or after arrival. */
export const MAP_LIVE_STATUSES = new Set(["EN_ROUTE"]);
export const ROUTE_STATUSES = new Set(["EN_ROUTE"]);
const TRIP_FULFILLMENT_TYPES = new Set(["instant", "scheduled"]);

export function isTripFulfillment(fulfillmentType) {
  return TRIP_FULFILLMENT_TYPES.has(fulfillmentType);
}

/** True while the decorator is driving to the venue, the only time the live map shows. */
export function isLiveTripOrder(order) {
  return Boolean(
    order && MAP_LIVE_STATUSES.has(order.status) && isTripFulfillment(order.fulfillmentType),
  );
}
