export function fulfillmentCardInfoContent({
  marketplaceEnabled,
  productInstantEnabled,
  policyLoaded,
}) {
  if (!policyLoaded) {
    return "Checking platform instant settings…"
  }

  if (marketplaceEnabled && productInstantEnabled) {
    return "Instant is live for this product when published. Shoppers can pick Schedule or Instant on the PDP."
  }

  if (marketplaceEnabled && !productInstantEnabled) {
    return "Platform instant is on. Turn on Instant below to offer it on this product."
  }

  if (!marketplaceEnabled && productInstantEnabled) {
    return (
      <>
        Instant copy is saved on this product but hidden on the site until you enable marketplace
        instant in Settings → Booking.
      </>
    )
  }

  return (
    <>
      You can set up Instant anytime. Customers only see it when marketplace instant and this
      product&apos;s Instant switch are both on.
    </>
  )
}

export const INSTANT_SWITCH_INFO =
  "Product-level instant. Edit and save even when platform instant is off."

export const INSTANT_COPY_SECTION_INFO =
  "Badge, PDP note, and ETA. Used on web when instant is visible."

export const PRODUCT_DETAILS_INFO =
  "Name, slug, and description shown on the customer booking menu and product page."
