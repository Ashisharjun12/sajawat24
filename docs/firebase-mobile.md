# Firebase files (user + vendor apps)

These files are **gitignored** so secrets and client keys are not pushed.

## `google-services.json` (Android / Expo push)

1. Firebase Console → Project settings → Your apps → Android app (`com.sajawat24.user` or `com.sajawat24.partner`).
2. Download `google-services.json`.
3. Place it at:
   - **User:** `app/user/google-services.json` (and copy to `app/user/android/app/google-services.json` after `expo prebuild` if that folder exists).
   - **Vendor:** `app/vendor/google-services.json`.

Templates: `google-services.json.example` in each app folder.

`app.json` in each app already points at `./google-services.json`.

## Firebase Admin SDK JSON (`*firebase-adminsdk*.json`)

**Server / FCM upload only** — never commit. Keep outside the repo (password manager, CI secret, EAS secret).

Patterns ignored: `*firebase-adminsdk*.json` (root, `app/user`, `app/vendor`).

## If these were ever committed

Rotate the Firebase service account key in Console and restrict API keys if the repo was public.
