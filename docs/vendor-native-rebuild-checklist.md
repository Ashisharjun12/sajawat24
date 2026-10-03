# Vendor native rebuild checklist

Use this after MapLibre, `expo-location` background, or other native module changes.

## Build

```bash
cd app/vendor
npm install
npx expo prebuild --clean
npx expo run:android
# or: eas build --profile development
```

Expo Go does not load MapLibre maps.

## Maps smoke test

1. Backend has Ola credentials; `GET /api/v1/maps/sdk-config` returns `styleUrl`.
2. Open an instant job as a **field** worker → en route → trip map shows customer + route.
3. Onboarding → **Add shop location** → search → confirm pin.

## Push smoke test

1. Install the new build on a physical device.
2. Log in and allow notifications (`syncPushRegistration` runs on login).
3. Trigger `VENDOR_NEW_JOB` (instant dispatch offer) or send a test push from Expo.
4. If you changed `android.package` or iOS bundle id, refresh FCM credentials in EAS and rebuild.
