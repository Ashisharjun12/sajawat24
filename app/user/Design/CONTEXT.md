# DeccorBuddys — user app context

Living brief for the customer mobile app (`app/user`). Update this file when each slice ships.

## Product

- **Brand:** DeccorBuddys (customer app).
- **Parity target:** [`app/web`](../../web) customer journeys — not [`app/vendor`](../../vendor) partner flows.
- **Stack:** Expo 54, Expo Router, NativeWind, `@/components/ui` (shadcn RN primitives), TanStack Query for catalog/home feeds.

## Non-negotiables

- Thin routes under `app/`; feature code under `module/*`; HTTP in `api/` (vendor-aligned).
- Tokens: [`lib/theme.ts`](../lib/theme.ts), Tailwind semantic colors — no random purple gradients or generic AI landing layouts.
- Home feed uses **real** CMS + catalog APIs when location is set; PDP uses **real** `GET /catalog/products/:id` when location is set.

## Current slice

| Field | Value |
|-------|--------|
| Name | Profile preferences — appearance (light default) |
| Status | shipped — Profile → Appearance (light/dark, SecureStore); `ThemeBootstrap` ignores system dark until user picks dark |
| Home UI | Browse feed without city + compact “Please select city” banner; auto city sheet; CMS/discovery rails match web View all + badge colors |
| Bag / checkout | No My bag screen — bag icon / add-to-bag → `/(app)/checkout` (Confirm booking → Payment); offers + address sub-routes |
| APIs | Cart, coupons, orders (create/cancel/resume, `GET /orders?bucket&page`, `GET /orders/:id`), `POST /payments/verify`; Cashfree UPI Intent Android |
| Payment QA | Online cancel/fail → cancel pending order, reset idempotency, alert “Order not placed” (bag unchanged); backend Cashfree 409 → reuse session; COD → confirmed only if `CONFIRMED`; success gates status |
| Location | Tab bootstrap + `useCatalogLocationGate` on PDP/home catalog |
| Parity | Normalization from web `home-catalog` / home CMS hero slides |
| Bottom nav | Home → Category → **Explore** → Instant → Profile; Instant tab orange (`INSTANT_TAB_HEX`); other tabs yellow primary |

## Module map

| Path | Owns |
|------|------|
| `module/onboarding/` | Welcome UI, phone + OTP, `otp.service`, SMS autofill hook |
| `module/home/` | `HomeTopBar` → `select-location` route; `HomeSearchBar` + city picker; CMS feed; `MerchSectionsSync`, `use-catalog-sections-query` |
| `module/catalog/components/CatalogProductCard.tsx` | Single browse product card (`layout` grid/rail); `use-product-merch-badge` |
| `store/merch-sections.store.ts` | City-scoped product → section badge index for cards |
| `module/location/` | `SelectLocationScreen`, `AddAddressScreen`, `ConfirmAddressMapScreen` (web-style form → Ola map + pin) |
| `module/geo/` | `OlaPinMapView`, `MapCenterPin`, `use-maps-sdk-config`, Ola auth (MapLibre) |
| `module/geo/` | `PlacesAddressAutocomplete` (maps API) |
| `module/booking/` | `checkout/*`, `abandon-incomplete-online-payment.ts`, `CashfreePaymentGatewayHost`, `cashfree-payment-bridge.ts`, `online-checkout-native.ts`, `place-order.ts` |
| `module/catalog/` | PLP + `ProductPdpScreen` (gallery Share + Home, `ProductShareSheet`, web `/p/{id}` share URL, breadcrumb, price, location, schedule/instant, coupon ticket rail, `ProductPdpAddonsSection`, About accordion, details tabs, rails, reviews, `ProductPdpMobileBookingBar`); hooks `use-product-detail-query`, `use-product-reviews-preview-query`, `use-similar-products-query`, `use-other-category-products-query`, `use-available-coupons` |
| `module/promotions/` | `CouponTicketCard` (rail/stack), `CouponOffersRail`, `CouponDetailSheet`, `CouponOffersFilterSheet`, `OffersScreen`; PDP horizontal coupons + `app/(app)/offers` (stacked tickets, filter, load more) |
| `module/account/` | `ProfileTabScreen`, `AccountScreen` (Personal info), `RefundsScreen`, `HelpScreen`, link phone/Google sheets; orders list/detail; `order-detail/*`; `account-nav`, `profile-menu` |
| `module/settings/` | `ThemeBootstrap`, `AppThemeOptions`, `use-app-theme`; light/dark preference (default light, not system) |
| `module/chat/` | `BookingChatScreen`, `SupportTopicChatScreen`, `use-booking-chat-thread`, `use-support-topic-chat-thread`, `help-topics`; order + support chat routes |
| `module/geo/` | `OlaTrackingMapView`, trip pins, `map-bounds` |
| `module/notifications/` | Inbox list (`use-user-notifications`, `NotificationRow`), tap routing (`resolve-notification-target`), query invalidation on push |
| `module/permissions/` | Post-login `enable-location` → `enable-notifications`; `use-permissions-setup-prompt` |
| `lib/notifications.ts`, `lib/push-registration.ts`, `lib/location.ts`, `lib/camera.ts`, `hooks/use-push-registration.ts`, `hooks/use-notification-listeners.ts` | Permissions, Expo push token sync, foreground handler + tap/receive listeners, location/camera helpers |
| `api/notifications.api.ts` | `POST/DELETE /user/devices`, `GET/PATCH /user/notifications` |
| `components/shell/SmoothScrollView.tsx` | Native smooth scroll defaults; web uses `lib/lenis-web` |
| `api/` | `client.ts` (401 → refresh + retry), `auth.api.ts`, `cms.api.ts` (`getSiteShell`), `refunds.api.ts`, `chat.api.ts` (`openCustomerSupport`), `addresses.api.ts`, `notifications.api.ts`, … |
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
| `lib/site-brand-contact.ts`, `lib/support-actions.ts` | `GET /catalog/cms/site-shell?platform=app` for WhatsApp/tel; alert if brand contact unset |
| `components/shell/` | `Screen`, `ScreenBackButton`, `TabScreenTitle`, `AppTabBar`, `LoadingPlaceholder` |
| `components/ui/` | Shared primitives — change rarely |

## Screen inventory

### Done

- [x] Onboarding: welcome → login hub (Google / phone) → sign-in → verify OTP
- [x] Login hub Google — native sign-in, backend session; mock Google removed
- [x] Phone OTP — real API, SMS autofill, dev OTP hint when API returns `otp`
- [x] Account linking — add phone + link Google on profile/account (no duplicate-account merge)
- [x] Consumer identity — shop owners/staff can sign into customer app with same phone (admin excluded)
- [x] `app/(app)/index` — Home header Deliver to {name} + delivery bottom sheet (India, places search, saved addresses, Confirm); search bar quick city picker
- [x] `app/(app)/profile/addresses` — list/add/edit via `GET/POST/PATCH /user/addresses`
- [x] `app/(app)/category` — All = top-level grid only; parent drill-down = horizontal subcategory rail + 2-col product grid (sort + custom price, load more); `parentSlug` / `childSlug`
- [x] `app/(app)/search` — popular setups + debounced product/category search (location required)
- [x] `app/(app)/instant` — instant-only catalog (`GET /catalog/products?instant=1`), sort/price toolbar, infinite scroll + pull-to-refresh
- [x] `app/(app)/explore` — web `/explore` parity: category rail + city-wide or filtered product grid (sort/price, load more)
- [x] `whatsapp` (FAB action)
- [x] `app/(app)/profile` tab — web `AccountNav` labels; push toggle + Notifications row; Personal info / orders / addresses / refunds / help stack
- [x] `app/(app)/profile/appearance` — Light / Dark theme (vendor parity); default light on boot
- [x] `app/(app)/profile/account` — Personal info, avatar initials, link phone (sheet) + link Google (sheet)
- [x] `app/(app)/profile/returns` — refunds list + summary (`GET /user/refunds`)
- [x] `app/(app)/profile/settings` — redirect to profile (placeholder Settings removed)
- [x] `app/(app)/profile/help` + `help/[topic]` — help topics accordion + in-app support chat
- [x] `app/(app)/notifications` — inbox (hidden tab route); back → home or profile by `from`; bottom tabs stay visible; re-tap tab → tab root (`lib/tab-roots.ts`)
- [x] `app/(app)/profile/orders` — All / Upcoming / Completed / Cancelled (horizontal pills), infinite scroll + load more, `OrderListCard` CTAs (payment, view, review)
- [x] `app/(app)/profile/orders/[id]` — map tracking layout only `EN_ROUTE`; `ON_SITE` / assigned / completed → classic detail + contact + timeline
- [x] `app/(app)/profile/orders/[id]/chat` — in-app decorator chat
- [x] Home `HomeActiveOrderBar` — ASSIGNED / EN_ROUTE / ON_SITE above tab bar
- [x] Home header notifications bell → `/(app)/notifications`; bag → checkout
- [x] `app/(app)/account` (redirect → profile/account), `search`, `product/[id]` (hidden from tab bar)
- [x] Product PDP — web mobile parity: `ProductPdpScreen`, reviews + coupons APIs, dual sticky CTA, add-to-bag → cart
- [x] `app/(app)/offers` — stacked ticket cards, product filter sheet, client load more; ticket rail on PDP above What's included
- [x] `app/(app)/checkout` — Confirm booking + Payment (mock parity); `checkout/offers`; address handled by `/(app)/location`; no separate My bag route

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
```
