const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL || 'https://www.deccorbuddys.com'
).replace(/\/$/, '');

if (__DEV__ && !GOOGLE_WEB_CLIENT_ID) {
  console.warn(
    '[env] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing — Google Sign-In will not work.',
  );
}

if (__DEV__ && !API_URL) {
  console.warn('[env] EXPO_PUBLIC_API_URL is missing — API calls will fail.');
}

export { API_URL, GOOGLE_WEB_CLIENT_ID, WEB_URL };
