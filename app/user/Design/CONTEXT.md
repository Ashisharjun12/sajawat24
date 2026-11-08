# DeccorBuddys — user app context

Living brief for the customer mobile app (`app/user`). Update this file when each slice ships.

## Product

- **Brand:** DeccorBuddys (customer app).
- **Parity target:** [`app/web`](../../web) customer journeys — not [`app/vendor`](../../vendor) partner flows.
- **Stack:** Expo 54, Expo Router, NativeWind, `@/components/ui` (shadcn RN primitives), TanStack Query for catalog/home feeds.

## Non-negotiables

- Thin routes under `app/`; feature code under `module/*`; HTTP in `api/` (vendor-aligned).
- Tokens: [`lib/design-tokens.ts`](../lib/design-tokens.ts) (source of truth) → `global.css` RGB vars → Tailwind semantic colors; [`lib/theme.ts`](../lib/theme.ts) `useThemeColors()` for native-only color props. No raw hex or Tailwind palette classes for brand UI.
- Brand rules: one orange `cta` button per screen; crimson `instant` only for Instant; disabled = `bg-disabled` / `text-disabled-foreground` (never opacity); Poppins 400/500/600 only via `font-normal|medium|semibold`; named type sizes (`text-display|h1|h2|h3|body|caption|micro|button`).
- Home feed uses **real** CMS + catalog APIs when location is set; PDP uses **real** `GET /catalog/products/:id` when location is set.

## Current slice

| Field | Value |
|-------|--------|
| Name | Explore listing header |
| Status | shipped — Explore uses `ExploreHeader` (back, title, search, cart badge); header fixed; category chips + sort/price filters sticky on scroll; no duplicate "N products" line |
| Theme | Light default + Dark via Profile → Appearance; dark uses `#0B1514` bg (no pure black) |
| Home UI | Browse feed without city + compact “Please select city” banner; auto city sheet; CMS/discovery rails match web View all + badge colors |
| Bag / checkout | Bag icon → `/(app)/checkout`; empty bag shows **My bag** + View packages; with items → Confirm booking → Payment; offers + address sub-routes |
| APIs | Cart, coupons, orders (create/cancel/resume, `GET /orders?bucket&page`, `GET /orders/:id`), `POST /payments/verify`; Cashfree UPI Intent Android |
| Payment QA | Online cancel/fail → cancel pending order, reset idempotency, alert “Order not placed” (bag unchanged); backend Cashfree 409 → reuse session; COD → confirmed only if `CONFIRMED`; success gates status |
| Location | Tab bootstrap + `useCatalogLocationGate` on PDP/home catalog |
| Parity | Normalization from web `home-catalog` / home CMS hero slides |
| Bottom nav | Home → Category → **Explore** → Instant → Profile; 72 tall + safe area; active teal primary (Instant tab crimson `INSTANT_TAB_HEX`), inactive muted |

## Module map

| Path | Owns |
|------|------|
| `module/onboarding/` | Welcome UI, phone + OTP, `otp.service`, SMS autofill hook; login hub header uses `assets/images/icon.png` |
| `module/home/` | `HomeTopBar` → `select-location` route; `HomeSearchBar` + city picker; CMS feed; `HomeLaunchAnnouncementSheet`, `use-launch-announcement-sheet`, `lib/announcement.ts`; `MerchSectionsSync`, `use-catalog-sections-query` |
| `module/catalog/components/ExploreHeader.tsx` | Explore listing header — back, title, Search → `/(app)/search`, Wishlist → `/(app)/wishlist` with count badge, Cart → `openCartCheckout` with count badge |
| `module/catalog/components/CatalogProductCard.tsx` | Single browse product card (`layout` grid/rail); `use-product-merch-badge` |
| `store/merch-sections.store.ts` | City-scoped product → section badge index for cards |
| `module/location/` | `SelectLocationScreen`, `AddAddressScreen`, `ConfirmAddressMapScreen` (web-style form → Ola map + pin) |
| `module/geo/` | `OlaPinMapView`, `MapCenterPin`, `use-maps-sdk-config`, Ola auth (MapLibre) |
| `module/geo/` | `PlacesAddressAutocomplete` (maps API) |
| `module/booking/` | `checkout/*`, `abandon-incomplete-online-payment.ts`, `CashfreePaymentGatewayHost`, `cashfree-payment-bridge.ts`, `online-checkout-native.ts`, `place-order.ts` |
| `module/catalog/` | PLP + `ProductPdpScreen` (`ProductPdpTopBar` back/search/wishlist/share, gallery with dots below, `ProductShareSheet`, web `/p/{id}` share URL, price + rating pill, location, schedule/instant, coupon ticket rail, `ProductPdpAddonsSection`, About accordion, details tabs, rails, reviews, `ProductPdpMobileBookingBar`); hooks `use-product-detail-query`, `use-product-reviews-preview-query`, `use-similar-products-query`, `use-other-category-products-query`, `use-available-coupons` |
| `module/promotions/` | `CouponTicketCard` (rail/stack), `CouponOffersRail`, `CouponDetailSheet`, `CouponOffersFilterSheet`, `OffersScreen`; PDP horizontal coupons + `app/(app)/offers` (stacked tickets, filter, load more) |
| `module/account/` | `ProfileTabScreen`, `ManageAccountScreen`, `DeleteAccountConfirmSheet`, `FaqScreen`, `AboutUsScreen`, `LogoutConfirmSheet`, `use-profile-sign-out`; `AccountScreen` (Personal info), `RefundsScreen`, `HelpScreen`, …; `profile-menu` |
| `store/wishlist.store.ts` | Guest SecureStore + logged-in `GET/POST/DELETE /wishlist`; merge on login via `apply-consumer-session` |
| `api/wishlist.api.ts` | Wishlist REST client (city-scoped hydration) |
| `module/settings/` | `ThemeBootstrap`, `AppearanceSheet`, `AppThemeOptions`, `use-app-theme`; light/dark preference (default light, not system) |
| `module/chat/` | `BookingChatScreen` (empty state + `ChatQuickReplyChips`), `SupportTopicChatScreen`, `use-booking-chat-thread`, `use-support-topic-chat-thread`, `help-topics`, `booking-chat-quick-replies`; order + support chat routes |
| `module/geo/` | `OlaTrackingMapView`, trip pins, `map-bounds` |
| `module/notifications/` | Inbox (`NotificationInboxCard`, All/Offers/Updates filters, `notification-inbox-filter`), push list (`use-user-notifications`), tap routing (`resolve-notification-target`), query invalidation on push |
| `module/permissions/` | Post-login `enable-location` → `enable-notifications`; `PermissionStepScreen` + `permission-step-assets`; `use-permissions-setup-prompt` |
| `lib/notifications.ts`, `lib/push-registration.ts`, `lib/location.ts`, `lib/camera.ts`, `hooks/use-push-registration.ts`, `hooks/use-notification-listeners.ts` | Permissions, Expo push token sync, foreground handler + tap/receive listeners, location/camera helpers |
| `api/notifications.api.ts` | `POST/DELETE /user/devices`, `GET/PATCH /user/notifications` |
| `components/shell/SmoothScrollView.tsx` | Native smooth scroll defaults; web uses `lib/lenis-web` |
| `api/` | `client.ts` (401 → refresh + retry), `auth.api.ts`, `account.api.ts` (`POST /user/account/delete`), `cms.api.ts` (`getSiteShell`), `refunds.api.ts`, `chat.api.ts` (`openCustomerSupport`), `addresses.api.ts`, `notifications.api.ts`, … |
| `module/auth/` | `consumer-session`, `AuthSessionBridge`, `NotificationListenersHost` (push register + listeners), `google-auth.service`, `link-google.service` |
| `lib/auth-session-refresh.ts` | JWT exp check, single-flight `POST /auth/refresh` for mobile |
| `module/onboarding/lib/otp-verify-errors.ts` | OTP_EXPIRED / INVALID / ATTEMPTS mapping |
| `lib/env.ts` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| `lib/query-client.ts`, `lib/query-keys.ts` | Shared React Query client + home query keys |
| `lib/location-storage.ts`, `lib/location-label.ts`, `lib/detect-gps-location.ts` | Persist + format label; GPS city detect |
| `store/auth.store.ts` | Welcome flag, API session (access + refresh token storage), pending OTP |
| `store/location.store.ts` | Backend cities, pincode, hydrate + persist |
| `store/delivery-location.store.ts` | Selected delivery address + header subtitle; applies to location store |
| `store/cart.store.ts` | Cart item count from `GET /cart` when authenticated |
| `store/checkout.store.ts` | Customer + delivery snapshot for confirm/pay |
| `lib/launch-announcement-storage.ts` | Dismissed Android launch announcement ids (SecureStore) |
| `lib/site-brand-contact.ts`, `lib/support-actions.ts` | `GET /catalog/cms/site-shell?platform=app` for WhatsApp/tel; alert if brand contact unset |
| `components/shell/` | `Screen`, `ScreenBackButton`, `TabScreenTitle`, `AppTabBar`, `LoadingPlaceholder`, `ScalePressable` (0.98 / 100ms) |
| `components/ui/` | Shared primitives — change rarely. `Button` variants `cta` (default) / `primary` / `secondary` / `instant` / `text`, sizes 48/40/32, `loading`; `Text` brand type variants + `maxFontSizeMultiplier` 1.3 |
| `lib/design-tokens.ts` | Brand colors light/dark, radius, space, type scale, button, `cardShadow`, `motion`, `MAX_FONT_SCALE` |
| `lib/theme.ts`, `lib/utils.ts` | `THEME` / `NAV_THEME` / `useThemeColors()`; `cn` with tailwind-merge aware of brand sizes/radii/shadows |
| `module/home/components/HomeBottomSheetModal.tsx` | Shared sheet (24 top radius, `BottomSheetHandle`, scrim tap closes) |

## Screen inventory

### Done

- [x] Onboarding: welcome → login hub (Google / phone) → sign-in → verify OTP
- [x] Login hub header uses the local app icon (`assets/images/icon.png`)
- [x] Login hub Google — native sign-in, backend session; mock Google removed
- [x] Phone OTP — real API, SMS autofill, dev OTP hint when API returns `otp`
- [x] Account linking — add phone + link Google on profile/account (no duplicate-account merge)
- [x] Consumer identity — shop owners/staff can sign into customer app with same phone (admin excluded)
- [x] `app/(app)/index` — Home header Deliver to {name} + delivery bottom sheet (India, places search, saved addresses, Confirm); search bar quick city picker
- [x] `app/(app)/profile/addresses` — list/add/edit via `GET/POST/PATCH /user/addresses`
- [x] `app/(app)/category` — All = top-level grid only; parent drill-down = horizontal subcategory rail + 2-col product grid (sort + custom price, load more); `parentSlug` / `childSlug`
- [x] `app/(app)/search` — popular setups + debounced product/category search (location required)
- [x] `app/(app)/instant` — instant-only catalog (`GET /catalog/products?instant=1`), sort/price toolbar, infinite scroll + pull-to-refresh
- [x] `app/(app)/explore` — web `/explore` parity: category rail + city-wide or filtered product grid (sort/price, load more); listing header with search + cart; category chips + sort/price filters sticky while scrolling
- [x] `whatsapp` (FAB action)
- [x] `app/(app)/profile` tab — web `AccountNav` labels; push toggle + Notifications row; Personal info / orders / addresses / refunds / help stack
- [x] Profile → Appearance — bottom sheet (light/dark + Save preference); default light on boot
- [x] Profile → More — Manage account (delete account sheet → API + sign out, logout confirm sheet), FAQ (static accordion), About us (placeholder + version)
- [x] Preferences — Appearance + push toggle only (notifications inbox via home bell)
- [x] `app/(app)/profile/account` — Personal info, avatar initials, link phone (sheet) + link Google (sheet)
- [x] `app/(app)/profile/returns` — refunds list + summary (`GET /user/refunds`)
- [x] `app/(app)/profile/settings` — redirect to profile (placeholder Settings removed)
- [x] `app/(app)/profile/help` + `help/[topic]` — help topics accordion + in-app support chat
- [x] `app/(app)/notifications` — inbox with All / Offers / Updates filters + card rows; Offers merges push `category: offer`, CMS announcements, city coupons; Mark all read in header; back → home or profile by `from`
- [x] Home launch promo — first eligible Android CMS announcement opens `HomeLaunchAnnouncementSheet` after city chosen (image or accent hero, CTA via `openCmsLink`, Maybe later persists dismiss)
- [x] `app/(app)/profile/orders` — All / Upcoming / Completed / Cancelled (horizontal pills), infinite scroll + load more, `OrderListCard` CTAs (payment, view, review)
- [x] `app/(app)/profile/orders/[id]` — map tracking layout only `EN_ROUTE`; `ON_SITE` / assigned / completed → classic detail + contact + timeline
- [x] `app/(app)/profile/orders/[id]/chat` — decorator chat; empty-state icon + tap-to-send quick replies above composer
- [x] Home `HomeActiveOrderBar` — ASSIGNED / EN_ROUTE / ON_SITE above tab bar
- [x] Home header notifications bell → `/(app)/notifications`; bag → checkout
- [x] `app/(app)/account` (redirect → profile/account), `search`, `product/[id]` (hidden from tab bar)
- [x] Product PDP — web mobile parity: `ProductPdpScreen`, reviews + coupons APIs, dual sticky CTA, add-to-bag → cart
- [x] `app/(app)/offers` — stacked ticket cards, product filter sheet, client load more; ticket rail on PDP above What's included
- [x] `app/(app)/checkout` — Confirm booking + Payment (mock parity); `checkout/offers`; address handled by `/(app)/location`; no separate My bag route
- [x] Brand retheme across all screens — teal/orange/crimson tokens, Poppins, buttons/cards/inputs/sheets/tab bar, splash + notification color `#0F766E`

### Planned (later)
- [ ] Search pagination / full PLP from search
- [ ] Bookings live map tracking (list + detail shipped; web parity on buckets)
- [x] Access-token refresh interceptor (401 retry + hydrate proactive refresh; silent redirect on hard failure)

## Design references

- Theme: [`lib/theme.ts`](../lib/theme.ts)
- Web: `HomeMobileHero`, `MobileBottomNav`, `HomeProductRail`, `use-home-discovery`, `cms.api`
- Vendor: tab icon spring only (`app/(app)/_layout.tsx` partner app)

## Out of scope (current slice)

- In-home category drill-down (web inline explorer on home); Category tab has full PLP
- Search results API
- iOS Google client / URL scheme
- Token refresh on 401, sockets, Ola map

## History (newest first)

```text
2026-11-08 — Help & support chat: admin close now closes it on the user side (backend emits `chat:status`; open screen hides the composer, shows "This chat was closed" + "Start a new chat"). Support "open" query no longer polled (the 15s POST used to auto-reopen closed chats). Backend never reuses a closed support chat → next visit starts a fresh one (old messages not shown); customer can't send into a closed one (409). Chat camera/photo permission: asked only when the user picks Take a photo / Choose from gallery (`pick-chat-attachment-permission.ts`: explain → system prompt → Open Settings if blocked); `expo-image-picker` plugin + prompt text added to app.json
2026-11-08 — PDP share sheet redesign (`ProductShareSheet`): "Share this setup" + product preview (photo, title, price on primary-tint) → link field with inline Copy that flips to green "Copied ✓" (stays open, haptic, no alert) → "Share via" row of round app targets: WhatsApp, Telegram, Facebook, Messages, Email, More (system sheet). New helpers in `lib/share-product.ts`
2026-11-08 — PDP VERIFIED chip: green as before (#DCFCE7 fill, #15803D text) with a filled blue shield-check (#2563EB, white tick, 16px); same on web
2026-11-08 — Delivery address sheet (`CheckoutAddressPickerSheet`, PDP + checkout): tap only picks (radio moves), bottom "Save address" applies + closes ("Add address" stays top; bottom button is Add address only when no saved addresses). PDP no longer drops to the full-page skeleton when the address changes (`useProductDetailQuery` keeps the same product as placeholder while it refetches for the new city/pin; delivery type no longer resets)
2026-11-08 — Account tab footer: "Privacy policy" link only (terms/refund removed) + app version → `/(app)/profile/legal/[doc]` (`LegalPageScreen`) loads the published CMS page (`GET /catalog/cms/pages/:slug`, tries slugs like privacy-policy/privacy, platform mobile then web), rendered with `components/ui/markdown-text.tsx`
2026-11-08 — Profile tab renamed "Account" (tab label + "My Account" title). New layout: account card (avatar, name, email/phone, edit → Personal info; guest = Sign in card) → 2×2 shortcut tiles `ProfileQuickActions` (My orders, Wishlist, Chat with us/WhatsApp, Saved addresses) → grouped white cards `ProfileMenuCard` with divided rows (Your account: Personal info, My cart, Refunds · Preferences · Support: Help, FAQ's · More: About us, Manage account)
2026-11-08 — PDP About this package, Package details and Ratings & reviews are full-width white panels (cancel 20px gutter, border top/bottom, no rounded card, like "Make it yours"); detail chips scroll edge to edge
2026-11-08 — PDP chip rotation adds an Instant face: FREE DELIVERY → section badge → crimson "INSTANT" + white zap (only when `product.instant.enabled`), 2.8s each, missing faces skipped
2026-11-08 — Product card (`CatalogProductCard`) rating star is golden yellow #F5B301 (was success green), matching the PDP rating pill
2026-11-08 — Search results (`SearchProductRow`): discount is now plain green "N% OFF" text next to the price (removed the rounded tinted pill)
2026-11-08 — PDP delivery location → saved-address bottom sheet (reuses `CheckoutAddressPickerSheet`: pick address, Add address button); signed-out still opens city picker. Add-address flow returns to the product page via new `beginLocationFlowReturningTo(href)` / `returnHref` in `location-flow.store` (checkout return unchanged)
2026-11-08 — PDP "Make it yours" — full-width white panel (cancels 20px PDP gutter, border top/bottom, no rounded card); addon rail scrolls edge to edge with 20px start inset; grid width = screen − 40
2026-11-08 — PDP offer cards — `CouponTicketCard` minimal: 240px white card (overflow-hidden), coupon code navy bold title (e.g. WELCOME10), "discount · title" description, svg `DiscountSeal` (pale mint scalloped %) pushed into top-right corner and clipped by the card; card icon removed, header icon kept; "N offers for this setup" removed, "View all" green
2026-11-08 — PDP chip rotation — `ProductPdpDeliveryChip`: "FREE DELIVERY" + scooter alternates every 2.8s with the product's merch section badge (Trending / Popular, section color, white text) via slide-up enter/exit; delivery-only when no section. Chips 22px tall, 10px uppercase, square corners (Verified matches); no icon on section face
2026-11-08 — PDP "FREE DELIVERY" chip — square-corner light green chip with `AnimatedScooter` (minimal line-art svg `ScooterIcon`, one color, rides out right, re-enters from left, parks 1.4s, loops; static under Reduce Motion), left of Verified; rating pill stays right
2026-11-08 — PDP delivery section — "Choose delivery preference": Delivery location field (svg `IndiaFlag` + address line + chevron → `/(app)/location`), Schedule / Instant as side-by-side rectangular cards (replaces underline tabs), removed "Choose your date and time…" copy; light-green section background kept
2026-11-08 — PDP layout — `ProductPdpTopBar` solid header (back · search, wishlist, cart with badge) above gallery; Similar on photo bottom-left, Share bottom-right; gallery overlay buttons + Home removed, page dots below photo; title 18 medium; Verified left + rating pill right (yellow star, rating | count); price 22
2026-11-08 — PDP — removed breadcrumb (Home / category / title) above the product title
2026-11-08 — Product card section badge (Trending / popular) — `RibbonBadge` svg wrap ribbon (notched left end, overhangs photo right edge 4px with darker folded tail), admin color fill; photo clip moved to inner view so ribbon can overhang
2026-11-08 — Product card Instant tag — `ProductCardInstantTag` (solid pink rectangle, square corners, white Zap + "Instant"); sits right after the rating with a 6px gap
2026-11-08 — Product card consistency — borderless card (rounded-xl image, no border/shadow/padding); fixed sizes for all cards (title 13/2 lines fixed height, MRP 12, price 14, tag 10, rating 12), price row never wraps; grid gap 12 × 24
2026-11-08 — Product card discount UI — `CatalogProductCard`: title → struck MRP + price + green gradient "N% OFF" tag (`DiscountTagSvg`, shape + text in SVG, slanted edge) → "★ 5 | 386" row pinned to bottom; Home header bag icon → `ShoppingCart`
2026-11-08 — Explore header — removed "N items" subtitle under the title; dropped `onTotalChange`
2026-11-08 — Explore sticky filters — sort/price toolbar pinned with category chips; "N products" line hidden on Explore (`showTotal={false}`); `CategoryProductListing` split into `useCategoryProductListing` + `CategoryProductListingToolbar` / `CategoryProductListingResults`
2026-11-08 — Explore listing header — `ExploreHeader` (back, category title + item count via `CategoryProductListing.onTotalChange`, search, cart badge); category rail sticky via `stickyHeaderIndices`
2026-10-08 — Checkout offers apply UX — optimistic cart coupon + per-card spinner; return delay 1.6s → 280ms
2026-10-08 — Empty bag + wishlist — `PackagesEmptyState`; bag icon opens checkout empty state (no alert); wishlist empty copy + View packages
2026-10-08 — Delete account data hygiene — backend purges inbox/cart/wishlist/addresses/refunds on delete; auth ignores tombstones; app clears React Query on logout/delete; admin hides refunds panel for deleted customers
2026-10-08 — Consumer account deletion — `account.api.ts` + `DeleteAccountConfirmSheet`; backend soft-delete tombstone (phone/google released, all sessions revoked)
2026-10-07 — Booking chat UX — empty thread state (MessageCircle + copy); always-on quick-reply chips (location/ETA) above composer — `BookingChatScreen`, `ChatQuickReplyChips`, `booking-chat-quick-replies`
2026-10-06 — Server wishlist — backend `wishlist_items` + `/api/v1/wishlist`; app sync on login (cart merge + wishlist merge); PDP/card hearts; unavailable rows on wishlist screen
2026-10-06 — Home header glass actions — wishlist, cart, notifications use `HomeHeaderGlassIconButton` (BlurView + light border/highlight on teal header)
2026-10-06 — Confirm booking — cart line image-left layout; Flipkart-style proceed bar + teal savings strip; horizontal suggested add-ons rail above offers (add updates cart)
2026-10-06 — PDP schedule bottom sheet — inline date/time removed; Book your setup opens Pick date & time slot sheet (product, slots, address, pay split, checkout CTA)
2026-10-06 — PDP pale green band — full-bleed `bg-primary-tint` behind fulfillment, offers, and add-ons; white cards sit on top
2026-10-05 — My orders status UX — hide payment-abandoned `CANCELLED` online orders from list (backend + client); status colors (teal active, orange pending, green complete, red cancelled); timeline only for confirmed+ journeys; `checkoutAbandoned` on order API
2026-10-05 — PDP web mobile parity — Schedule/Instant tab icons (calendar + zap), schedule card header, instant detail row colors, package-details chips + included list, add-ons rose gift icon
2026-10-05 — City picker sheet — web layout (search, popular grid, all cities); Lucide MapPin; removed map image URLs
2026-10-05 — Home header — city pill top-left (MapPin + name + chevron); full-width search; removed Deliver to + search-bar map icon
2026-10-05 — Catalog product card web parity — discount on image, Instant line (Zap + ETA in body), title min-height, no root overflow clip; grid row stretch
2026-10-05 — Brand retheme — `lib/design-tokens.ts` + RGB CSS vars, Poppins 400/500/600 (font plugin + type scale), Button cta/primary/secondary/instant/text, cards/inputs/OTP/sheets/tab bar, palette → tokens, CTA triage, light haptics (Book Now, OTP), app.json + android colors `#0F766E`
2026-10-03 — Checkout address picker — Confirm booking Change opens bottom sheet to select saved address (`CheckoutAddressPickerSheet`)
2026-10-03 — Personal info UI — name + avatar header, contact card (email/phone); removed intro copy, upload stub, sign-in row
2026-10-03 — Profile appearance — Preferences → Appearance screen; `ThemeBootstrap` + SecureStore; default light (not system)
2026-10-03 — Checkout cart lines — Remove on Confirm booking (`DELETE /cart/items/:id`, web cart parity)
2026-10-03 — Home CMS banners — restore `getHomeCms` in `api/cms.api.ts` (`platform=android`) so admin Android hero banners load on home carousel
2026-10-03 — Mock/placeholder cleanup — removed `lib/mock/`; support via site-shell brand; dropped Settings screen; PDP empty tabs show no-data copy
2026-10-03 — Online payment abandon — cancel `PENDING_PAYMENT` on gateway exit/fail; simple “Order not placed” alert; no retry banner; `abandon-incomplete-online-payment.ts`
2026-10-03 — PDP share v1 — gallery Share + `ProductShareSheet` (WhatsApp, copy, system share); `EXPO_PUBLIC_WEB_URL` + `/p/{id}` links
2026-10-03 — PDP About accordion — description moved off title into collapsible “About this package” above details tabs (web content order)
2026-10-02 — CatalogProductCard — one dynamic grid/rail card; fix merch Zustand selector infinite loop; sections signature skip on refetch
2026-10-02 — Home/catalog web parity — global merch section badges; `ProductRailHeader` View all → on category rows + package rails + PDP similar/explore rails; `resolveViewAllCategoryHref` / `getCategoryListingHref`
2026-10-01 — Live tracking — GET /orders/:id/tracking, map-first detail, Home active-order bar, order chat API + screen
2026-10-01 — Order tracking map — `GET /orders/:id/route` black polyline + vendor→home fallback; ImageKit delivery pin; bottom-left Open in Google Maps chip
2026-10-01 — User trip map parity — trimRouteAhead + route refetch (75m/15s); stale GPS keeps last pin/line; location.png + blue live dot on tracking map
2026-10-01 — Tab + inbox nav — notifications off profile stack; tab re-tap pops to root; back from inbox respects `from=home|profile`
2026-10-01 — Customer assign alerts — `BOOKING_ASSIGNED` push/inbox on vendor accept + field worker/self-assign; payload includes `orderId` for deep link
2026-10-07 — Launch announcement sheet + notifications offers — Android CMS announcements on home API; admin Content → Android → Announcements CRUD; inbox filter chips + promo/coupon cards
2026-10-01 — Push + inbox — `module/notifications`, `profile/notifications`, listeners host; order lifecycle push + in_app; completion code SMS/WhatsApp/email only (vendor sends, not inbox)
2026-10-01 — My Orders UI — backend `bucket` on GET /orders; mobile horizontal filter tabs + paginated list + order detail route; web BookingsPage server-side buckets + load more
2026-10-01 — Expo push — google-services.json + EAS projectId; token sync via POST /user/devices; FCM upload on expo.dev still manual
2026-09-30 — Profile tab UI — borderless sections, larger header avatar, soft row press states, plain log out
2026-09-30 — Cashfree Android UPI — official `react-native-cashfree-pg-sdk`; native only when `CashfreePgApi` linked (`expo run:android`); else WebView fallback; iOS WebView
2026-09-30 — Booking confirmed screen — full-page success after pay/COD with ImageKit tick, Browse products + View order
2026-09-30 — Home browse without city — CMS/rails load (browse city fallback); slim select-city banner replaces blocking prompt
2026-09-30 — Home city sheet — auto-open when no city after bootstrap; picker rows use `HOME_CITY_MAP_ICON_URI` (search bar parity)
2026-10-01 — Booking confirmed route — `/(app)/checkout/success/:orderId` (native path, not web domain); ImageKit tick + `confirmedOrderId` until user leaves screen
2026-10-01 — Payment failure flow — `PENDING_PAYMENT` cancel/resume APIs; no auto-COD; mobile Payment banner + success gate; web checkout/confirmation parity; My orders list
2026-10-01 — Profile account — `GET /user/me` sync, read-only account fields, gutter-aligned profile stack; removed dev reset + link phone/Google promo UI
2026-09-30 — Auth silent refresh — 401 interceptor, proactive hydrate refresh, server logout on sign-out, AuthSessionBridge redirect
2026-09-30 — Select location + add address — card UI, address list skeleton, city-scoped PIN resolve (web parity), shared AddressFormFields + pin validation hook
2026-09-30 — Checkout minimal pass — product-only price on line card (add-ons sum to item total), green item total, solid sticky bar, price-free Proceed CTA, address → select-location
2026-09-30 — Confirm + Payment UI — mock parity confirm/pay screens; bag/add-to-bag → checkout; addon skip = package-only display; Cashfree WebView + Razorpay
2026-09-30 — Bag/checkout UI removed — deleted cart + checkout routes and screen components for redesign; cart API + header badge unchanged
2026-09-29 — Two-stage checkout — bag slim; confirm → offers/address → pay stack; checkout store; Cashfree WebView + Razorpay native; retired monolithic CheckoutScreen
2026-09-29 — Bag + checkout redesign — shared order line/addon UI (web parity); payment methods RQ + retry banner; full-row pay online/COD; primary proceed/pay bars
2026-09-29 — PDP catalog gate — `useCatalogLocationGate` (chosen city, same as home/Instant); friendly `catalogLocationErrorMessage` + Try again; location prompt copy
2026-09-29 — Location web parity — tab bootstrap hydrate + cities only (no default city / auto GPS); home CMS/discovery when `isLocationChosen`; `HomeLocationPrompt`; GPS pincode only if deliverable (`detect-gps-location`, `isPincodeDeliverable`)
2026-09-28 — PDP other-categories rail — “Explore other categories” horizontal rail (city catalog minus current category); app `useOtherCategoryProductsQuery` + web `ProductOtherCategoriesRail`
2026-09-28 — PDP similar rail — “You may also like” header + amber ‹ ›; ~38% width cards (`HomeProductCard` compact); web `ProductRelatedRail` + `PRODUCT_RAIL_PDP_SIMILAR_ITEM_CLASS`
2026-09-28 — Cart + checkout — `/(app)/cart`, checkout screen, promo/qty, COD + Razorpay place-order, success sheet
2026-09-28 — PDP addon sheet — `HomeBottomSheetModal`, horizontal ~2-card rail; reset selection on open
2026-09-28 — `ScreenBackButton` + `goBackOneScreen`; PDP offers on product stack; back no longer forces home on PDP/offers
2026-09-28 — Offers screen — vertical ticket cards, filter sheet (setup/other), client load more; removed copy blurb
2026-09-28 — Screen `gutter` + `SCREEN_HORIZONTAL_GUTTER` (20px); offers + checkout stack pages
2026-09-28 — Coupons location — retry cityId when pincode not serviceable (promotions API parity with catalog)
2026-09-28 — PDP coupons fix — city-scope fetch + product-first filter; offers card below delivery; loading state
2026-09-28 — PDP coupon tickets — horizontal rail, detail bottom sheet, View all → offers screen
2026-09-28 — PDP Later schedule — date-only modal; chosen date on card + time slots on PDP (not in modal)
2026-09-28 — PDP details tabs — What's included / FAQs / Delivery / Care as Schedule-style underline tabs with horizontal card rails (accordion removed)
2026-09-28 — PDP reviews accordion — web-style summary (avg + 5-star row + distribution bars), review cards, tap to expand
2026-09-28 — PDP web parity — ProductPdpScreen replaces FNP layout; reviews/promotions APIs; WhatsApp + Book Now; proceed-to-checkout + checkout stub
2026-09-28 — Product cards — square image, fixed title/reviews/price slots (same card size without row stretch); Instant infinite scroll; Explore/Category Load more
2026-09-28 — Explore tab — bottom nav after Category; ExploreScreen mirrors web /explore (category chips + catalog listing, optional categoryId param)
2026-09-26 — Catalog location helper — PDP/search/similar use cityId+pincode with city-only retry (`getProductForCatalogLocation`, `listProductsForCatalogLocation`); cart add sends both like web
2026-09-26 — Product PDP API — real catalog detail + similar rail; delivery date chips; addons inline + customize sheet; cart addItem; module/catalog/components/product-detail/*
2026-09-26 — Select location stack — header opens full-screen saved addresses + add flow; web-like address form → Ola MapLibre pin confirm; ImageKit pin asset
2026-09-26 — GPS auto-location — device GPS → reverse geocode + pincode resolve; local `device` source for catalog/CMS; header “Near {city}”; no address POST
2026-09-26 — Home delivery location — FNP-style header, delivery sheet + addresses/maps API, delivery-location store, profile addresses wired
2026-09-26 — Home city picker — search bar MapPin → bottom sheet with city search + radio list; persists via location store
2026-09-26 — Profile hub UI — grouped card sections, notification permission toggle, TabScreenTitle + logout pill (light theme)
2026-09-26 — Instant tab — API instant filter, FlatList infinite scroll, orange tab chrome; backend public `instant=1`
2026-09-28 — Home web parity — default service city, CMS fetch without `isLocationChosen` gate, discovery fallback when no android layout blocks, removed auto select-location on home load
2026-09-26 — Category PLP — subcategory horizontal rail, listProducts with web sort/price filters, 2-col grid + load more
2026-09-26 — Category + search layout polish — safe-area horizontal insets, spacing, removed category helper copy; hide placeholder category* names in browse/search
2026-09-26 — Catalog search screen — home bar → search route; popular + debounced q; category suggestions; SearchProductRow list (web parity)
2026-09-26 — Android home feed CMS-only — no web/mobile layout blocks or catalog fallback; strict `android` platform on home-layout API; admin AppHomeLayoutPanel + horizontal categories + Category tab
2026-09-25 — Home web mobile parity — `HomeDiscoveryFeed`, 4-col categories, `HomeLayoutWithPromos`, RQ cache like web; no home filter chips / marketing blocks
2026-09-25 — Post-login permissions — vendor full-screen `enable-location` → `enable-notifications` (native OS dialogs); `use-permissions-setup-prompt` in app layout
2026-09-25 — Permissions + scroll — SmoothScrollView + Lenis (web); app.json location/notifications/camera manifests
2026-09-25 — Home feed UX — full-bleed CMS banners + 6s autoplay; HomeFeedSkeleton; pull-to-refresh on home
2026-09-25 — Home polish — product stack route fix; tab/card press scale + light haptics; expo-keep-awake + WAKE_LOCK for dev keep-awake errors
2026-09-25 — Home UI + API feed — TopBar/search layout; CMS mobile hero + sections/products; geo location; cart badge; React Query — api/cms+geo+cart, module/home/hooks, store/location+cart
2026-09-25 — Dev Metro — fixed ports (user 8081, vendor 8080), `scripts/expo-dev.js`, metro blockList for native build dirs
2026-10-01 — Booking chat realtime — user app Socket.IO (`SocketProvider`, focus/blur, poll fallback offline), vendor-parity UI (keyboard lift, + attachments, typing, read ticks), `chat.api` presign/upload — `module/chat/*`, `providers/socket-provider.tsx`
2026-10-01 — Dev Metro — blockList excludes full `android/` + `ios/` (fixes Windows watch timeout on `android/app/build` after native builds)
2026-10-01 — Dev Expo CLI — `scripts/expo-dev.js` sets default `EXPO_NO_CACHE=1` (dual-app start / shared `~/.expo` API cache "Body already read" crash)
2026-10-01 — Order chat route — `profile/orders/[id].tsx` + `[id]/chat` (vendor-style); fix chat icon navigation (`user:///` unmatched)
2026-10-02 — Booking chat send — UUID `clientMessageId` (API validation); send/attach error alerts; user GET conversation lazy-opens via `openBookingConversationForOrder`
2026-10-02 — Order detail map — tracking map layout only for `EN_ROUTE`; `ON_SITE` uses classic detail (decorator on site, no live map)
2026-10-03 — Windows `npm run android` — `win-native-run-helpers` detached Metro + `--no-bundler`; LAN packager hostname for devices
2026-10-03 — PDP sticky bar (web mobile) — `ProductPdpMobileBookingBar` price + compact WhatsApp + Book your setup
2026-10-02 — PDP addons (web) — `ProductPdpAddonsSection` horizontal rail below offers; Book Now uses inline selection (removed customize bottom sheet)
2026-10-02 — Order reviews — `OrderReviewSheet` (interactive 5★ + text), orders list + detail, `POST /orders/:id/review`
2026-09-25 — Unified consumer identity — consumer-session (vendor/staff OK); backend eligibility, self-dealing, shop-block staff; web parity
2026-09-25 — OTP hardening + account linking — verify debounce, otp-verify-errors, resend cooldown; `user.api` + Account link phone/Google
2026-09-25 — Phone OTP (API) — `auth.api` request/verify, `otp.service`, customer-session guard, Android SMS autofill; mock OTP removed
2026-09-25 — Vendor-style layout — `app/`, `api/`, `module/`, `lib/`, `store/` at project root (no `src/`); axios `api/client` + `auth.api`
2026-09-25 — Google auth (Android) — env + `.env.example`, GIS plugin, `GoogleSignin.configure`, `POST /auth/google`, secure refresh token + profile hydrate; mock Google removed — lib/env, api, module/auth/services, LoginHubScreen
2026-09-24 — Login hub — Google + phone chooser after welcome; mock Google session — login.tsx, LoginHubScreen
2026-09-24 — Product PDP (mock) — Home card → product/[id]; ProductPdp-style UI, schedule/instant, accordions — module/catalog, lib/mock/products.ts
2026-09-24 — Profile hub + home bell — Profile stack, menu (Account, My orders, Addresses, …), mock addresses; home notifications icon — module/account, profile/, HomeStickyHeader
2026-03-24 — Native 4-tab bar — Home/Category/Instant/Profile, neutral icons; Profile tab + WhatsApp in profile — AppTabBar, profile.tsx, ProfileTabScreen
2026-03-24 — Home + bottom nav (mock) — Home feed with mock rails; account/search — app/(app), module/home, lib/mock, store/location+cart
2026-03-23 — Onboarding slice (mock) — Welcome + sign-in + OTP + placeholder home; CONTEXT/AGENTS; auth.store mock session — app/(onboarding), module/onboarding, module/auth, store/, lib/, components/shell/
2026-10-03 — Search screen category chips — `SearchCategoryBadges` + web-aligned limits/copy on `SearchScreen`
2026-10-03 — PDP similar packages — gallery “Similar” pill + `ProductPdpSimilarPackages` bottom sheet (web mobile parity)
2026-10-03 — Profile web parity — Personal info linking, refunds/settings/help screens, support topic chat — module/account, module/chat, api/refunds
2026-10-08 — Post-login permissions — ImageKit map + notification illustrations on enable screens; decoration/delivery copy — `module/permissions/lib/permission-step-assets.ts`
2026-10-08 — Profile appearance — bottom sheet + Save preference; deleted `profile/appearance` screen — `AppearanceSheet`, `ProfileTabScreen`
2026-10-08 — Profile More — manage-account/faq/about routes; logout confirm sheet; removed profile-tab logout — `profile-menu`, `ManageAccountScreen`
2026-11-06 — Login hub branding — use local app icon in login header — `module/onboarding/components/LoginHubScreen`
